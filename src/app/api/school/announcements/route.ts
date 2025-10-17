import { authOptions } from '@/lib/auth';
import { notifyAboutNewAnnouncement } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content too long'),
  targetAudience: z.enum(['STUDENTS', 'TEACHERS', 'ALL']),
  classIds: z.array(z.string()).optional(),
  subjectIds: z.array(z.string()).optional(),
  recipientIds: z.array(z.string()).optional(), // Specific user IDs for individual selection
  isPinned: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: 'School ID not found in session' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createAnnouncementSchema.parse(body);

    // Validate that specified classes/subjects belong to the school
    if (validatedData.classIds && validatedData.classIds.length > 0) {
      const schoolClasses = await prisma.class.findMany({
        where: {
          schoolId: session.user.schoolId,
          id: { in: validatedData.classIds },
        },
        select: { id: true },
      });

      const schoolClassIds = schoolClasses.map(c => c.id);
      const invalidClassIds = validatedData.classIds.filter(
        id => !schoolClassIds.includes(id)
      );

      if (invalidClassIds.length > 0) {
        return NextResponse.json(
          { error: 'Some specified classes do not belong to your school' },
          { status: 403 }
        );
      }
    }

    if (validatedData.subjectIds && validatedData.subjectIds.length > 0) {
      const schoolSubjects = await prisma.subject.findMany({
        where: {
          schoolId: session.user.schoolId,
          id: { in: validatedData.subjectIds },
        },
        select: { id: true },
      });

      const schoolSubjectIds = schoolSubjects.map(s => s.id);
      const invalidSubjectIds = validatedData.subjectIds.filter(
        id => !schoolSubjectIds.includes(id)
      );

      if (invalidSubjectIds.length > 0) {
        return NextResponse.json(
          { error: 'Some specified subjects do not belong to your school' },
          { status: 403 }
        );
      }
    }

    // Validate recipientIds if provided (must be users in the school)
    if (validatedData.recipientIds && validatedData.recipientIds.length > 0) {
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: validatedData.recipientIds },
          schoolId: session.user.schoolId,
          role: { in: ['STUDENT', 'TEACHER'] }, // School admin can send to students and teachers
        },
        select: { id: true },
      });

      const validUserIds = validUsers.map(u => u.id);
      const invalidRecipientIds = validatedData.recipientIds.filter(
        id => !validUserIds.includes(id)
      );

      if (invalidRecipientIds.length > 0) {
        return NextResponse.json(
          {
            error:
              'Some specified users do not belong to your school or are not valid recipients',
          },
          { status: 403 }
        );
      }
    }

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        authorId: session.user.id,
        authorRole: 'SCHOOL_ADMIN',
        schoolId: session.user.schoolId,
        targetAudience: validatedData.targetAudience,
        classIds: validatedData.classIds || [],
        subjectIds: validatedData.subjectIds || [],
        recipientIds: validatedData.recipientIds || [],
        isPinned: validatedData.isPinned,
      },
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
    });

    // Get target user IDs for notifications
    let targetUserIds: string[] = [];

    // If recipientIds is provided, use those specific users
    if (validatedData.recipientIds && validatedData.recipientIds.length > 0) {
      targetUserIds = validatedData.recipientIds;
    } else {
      // Otherwise use the existing class/subject/audience logic
      if (
        validatedData.targetAudience === 'STUDENTS' ||
        validatedData.targetAudience === 'ALL'
      ) {
        const studentWhere: any = {
          schoolId: session.user.schoolId,
          status: 'ACTIVE',
        };

        if (validatedData.classIds && validatedData.classIds.length > 0) {
          studentWhere.classId = { in: validatedData.classIds };
        }

        const students = await prisma.student.findMany({
          where: studentWhere,
          select: { userId: true },
        });

        targetUserIds.push(...students.map(s => s.userId));
      }

      if (
        validatedData.targetAudience === 'TEACHERS' ||
        validatedData.targetAudience === 'ALL'
      ) {
        const teachers = await prisma.teacher.findMany({
          where: {
            schoolId: session.user.schoolId,
            status: 'ACTIVE',
          },
          select: { userId: true },
        });

        targetUserIds.push(...teachers.map(t => t.userId));
      }
    }

    // Send notifications
    if (targetUserIds.length > 0) {
      await notifyAboutNewAnnouncement(
        announcement.id,
        session.user.name || 'School Admin',
        announcement.title,
        targetUserIds
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: 'School ID not found in session' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const targetAudience = searchParams.get('targetAudience') || '';
    const authorRole = searchParams.get('authorRole') || '';
    const isPinned = searchParams.get('isPinned');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { author: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (targetAudience && targetAudience !== 'all') {
      where.targetAudience = targetAudience.toUpperCase();
    }

    if (authorRole && authorRole !== 'all') {
      where.authorRole = authorRole.toUpperCase();
    }

    if (isPinned !== null && isPinned !== undefined) {
      where.isPinned = isPinned === 'true';
    }

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

    return NextResponse.json({
      success: true,
      announcements,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
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
