import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        class: {
          include: {
            subjects: {
              select: { subjectId: true },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const authorRole = searchParams.get('authorRole') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Helper function to handle both null and empty arrays
    const nullOrEmpty = (field: string) => ({
      OR: [{ [field]: { equals: null } }, { [field]: { equals: [] } }],
    });

    // Build where clause for announcements the student should see
    const where: any = {
      schoolId: student.schoolId,
      isPublished: true,
      OR: [
        // Announcements targeted to all students (no specific targeting)
        {
          targetAudience: 'STUDENTS',
          AND: [nullOrEmpty('classIds'), nullOrEmpty('subjectIds')],
        },
        // Announcements targeted to all users
        {
          targetAudience: 'ALL',
        },
        // Announcements with any targeting (we'll filter in application layer)
        {
          targetAudience: { in: ['STUDENTS', 'ALL'] },
          OR: [
            { classIds: { not: null } },
            { subjectIds: { not: null } },
            { recipientIds: { not: null } },
          ],
        },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { author: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    if (authorRole && authorRole !== 'all') {
      where.authorRole = authorRole.toUpperCase();
    }

    // Add logging for debugging
    console.log(
      '📢 Announcement query filter:',
      JSON.stringify(where, null, 2)
    );

    const [announcements, totalCount] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    // Add logging for debugging
    console.log('📢 Announcements found:', announcements.length);
    console.log('📢 Total count:', totalCount);

    // Filter announcements based on targeting in application layer
    const filteredAnnouncements = announcements.filter((announcement: any) => {
      // Always show announcements targeted to ALL
      if (announcement.targetAudience === 'ALL') {
        return true;
      }

      // Show announcements targeted to STUDENTS with no specific targeting
      if (
        announcement.targetAudience === 'STUDENTS' &&
        !announcement.classIds &&
        !announcement.subjectIds &&
        !announcement.recipientIds
      ) {
        return true;
      }

      // Check if student is in targeted classes
      if (announcement.classIds && Array.isArray(announcement.classIds)) {
        if (announcement.classIds.includes(student.classId)) {
          return true;
        }
      }

      // Check if student's subjects are in targeted subjects
      if (
        announcement.subjectIds &&
        Array.isArray(announcement.subjectIds) &&
        student.class?.subjects &&
        student.class.subjects.length > 0
      ) {
        const studentSubjectIds = student.class.subjects.map(
          cs => cs.subjectId
        );
        const hasMatchingSubject = announcement.subjectIds.some(
          (subjectId: any) => studentSubjectIds.includes(subjectId)
        );
        if (hasMatchingSubject) {
          return true;
        }
      }

      // Check if student is in recipientIds
      if (
        announcement.recipientIds &&
        Array.isArray(announcement.recipientIds)
      ) {
        if (announcement.recipientIds.includes(student.userId)) {
          return true;
        }
      }

      return false;
    });

    // Add logging for debugging
    console.log('📢 Filtered announcements:', filteredAnnouncements.length);

    return NextResponse.json({
      success: true,
      announcements: filteredAnnouncements,
      pagination: {
        page,
        limit,
        total: filteredAnnouncements.length,
        pages: Math.ceil(filteredAnnouncements.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
