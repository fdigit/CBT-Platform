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

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createAnnouncementSchema.parse(body);

    // Validate that teacher has access to specified classes/subjects
    if (validatedData.classIds && validatedData.classIds.length > 0) {
      const teacherClasses = await prisma.classSubject.findMany({
        where: {
          teacherId: teacher.id,
          classId: { in: validatedData.classIds },
        },
        select: { classId: true },
      });

      const teacherClassIds = teacherClasses.map(tc => tc.classId);
      const invalidClassIds = validatedData.classIds.filter(
        id => !teacherClassIds.includes(id)
      );

      if (invalidClassIds.length > 0) {
        return NextResponse.json(
          {
            error:
              'You are not authorized to post announcements to some of the specified classes',
          },
          { status: 403 }
        );
      }
    }

    if (validatedData.subjectIds && validatedData.subjectIds.length > 0) {
      const teacherSubjects = await prisma.classSubject.findMany({
        where: {
          teacherId: teacher.id,
          subjectId: { in: validatedData.subjectIds },
        },
        select: { subjectId: true },
      });

      const teacherSubjectIds = teacherSubjects.map(ts => ts.subjectId);
      const invalidSubjectIds = validatedData.subjectIds.filter(
        id => !teacherSubjectIds.includes(id)
      );

      if (invalidSubjectIds.length > 0) {
        return NextResponse.json(
          {
            error:
              'You are not authorized to post announcements to some of the specified subjects',
          },
          { status: 403 }
        );
      }
    }

    // Validate recipientIds if provided (must be students in teacher's classes)
    if (validatedData.recipientIds && validatedData.recipientIds.length > 0) {
      // Get all students in teacher's classes
      const teacherClassIds = await prisma.classSubject.findMany({
        where: { teacherId: teacher.id },
        select: { classId: true },
      });

      const classIds = teacherClassIds.map(tc => tc.classId);

      if (classIds.length === 0) {
        return NextResponse.json(
          { error: 'You are not assigned to any classes' },
          { status: 403 }
        );
      }

      // Check if all recipientIds are students in teacher's classes
      const validStudents = await prisma.student.findMany({
        where: {
          userId: { in: validatedData.recipientIds },
          classId: { in: classIds },
          status: 'ACTIVE',
        },
        select: { userId: true },
      });

      const validStudentIds = validStudents.map(s => s.userId);
      const invalidRecipientIds = validatedData.recipientIds.filter(
        id => !validStudentIds.includes(id)
      );

      if (invalidRecipientIds.length > 0) {
        return NextResponse.json(
          {
            error:
              'You can only send announcements to students in your assigned classes',
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
        authorRole: 'TEACHER',
        schoolId: teacher.schoolId,
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
          schoolId: teacher.schoolId,
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
            schoolId: teacher.schoolId,
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
        session.user.name || 'Teacher',
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

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const targetAudience = searchParams.get('targetAudience') || '';
    const isPinned = searchParams.get('isPinned');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause - show announcements created by teacher OR targeted to teachers
    const where: any = {
      schoolId: teacher.schoolId,
      isPublished: true,
      OR: [
        // Announcements created by this teacher
        {
          authorId: session.user.id,
        },
        // Announcements targeted to teachers
        {
          targetAudience: 'TEACHERS',
        },
        // Announcements targeted to all users
        {
          targetAudience: 'ALL',
        },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (targetAudience && targetAudience !== 'all') {
      where.AND = where.AND || [];
      where.AND.push({
        targetAudience: targetAudience.toUpperCase(),
      });
    }

    if (isPinned !== null && isPinned !== undefined) {
      where.AND = where.AND || [];
      where.AND.push({
        isPinned: isPinned === 'true',
      });
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
