import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Helper function to handle both null and empty arrays
    const nullOrEmpty = (field: string) => ({
      OR: [{ [field]: { equals: null } }, { [field]: { equals: [] } }],
    });

    // Build where clause for announcements the student should see
    const where: any = {
      id,
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

    const announcement = await prisma.announcement.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Apply application-level filtering for targeted announcements
    const canAccess = (() => {
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
    })();

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
