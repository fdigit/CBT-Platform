import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createLessonPlanSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  topic: z.string().optional(),
  duration: z.number().int().positive('Duration must be positive'),
  objectives: z.array(z.string()).min(1, 'At least one objective is required'),
  materials: z.array(z.string()).optional(),
  activities: z.array(z.string()).min(1, 'At least one activity is required'),
  assessment: z.string().optional(),
  homework: z.string().optional(),
  notes: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  scheduledDate: z.string().optional(),
});

const updateLessonPlanSchema = createLessonPlanSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const reviewStatus = searchParams.get('reviewStatus');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      teacherId: teacher.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (reviewStatus && reviewStatus !== 'all') {
      where.reviewStatus = reviewStatus.toUpperCase();
    }

    if (classId && classId !== 'all') {
      where.classId = classId;
    }

    if (subjectId && subjectId !== 'all') {
      where.subjectId = subjectId;
    }

    // Get lesson plans with pagination
    const [lessonPlans, totalCount] = await Promise.all([
      prisma.lessonPlan.findMany({
        where,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
          resources: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              filePath: true,
              fileSize: true,
              mimeType: true,
              resourceType: true,
              uploadedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.lessonPlan.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      lessonPlans,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    console.log('Creating lesson plan for teacher:', {
      teacherId: teacher.id,
      userId: session.user.id,
      schoolId: teacher.schoolId,
    });

    const body = await request.json();
    const validatedData = createLessonPlanSchema.parse(body);

    // Verify teacher has access to the class and subject
    // TODO: Implement proper teacher-class-subject assignment system
    // For now, allow lesson plan creation with warning logs
    if (validatedData.classId && validatedData.classId !== 'none') {
      console.log('Checking class access:', {
        teacherId: teacher.id,
        classId: validatedData.classId,
      });

      const classAccess = await prisma.teacherClass.findFirst({
        where: {
          teacherId: teacher.id,
          classId: validatedData.classId,
        },
      });

      console.log('Class access result:', classAccess);

      if (!classAccess) {
        console.log(
          '⚠️ Teacher does not have access to class, but allowing lesson plan creation'
        );
        // TODO: Uncomment this when teacher-class relationships are properly set up
        // return NextResponse.json(
        //   { message: 'You do not have access to this class' },
        //   { status: 403 }
        // );
      }
    }

    if (validatedData.subjectId && validatedData.subjectId !== 'none') {
      console.log('Checking subject access:', {
        teacherId: teacher.id,
        subjectId: validatedData.subjectId,
      });

      const subjectAccess = await prisma.teacherSubject.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: validatedData.subjectId,
        },
      });

      console.log('Subject access result:', subjectAccess);

      if (!subjectAccess) {
        console.log(
          '⚠️ Teacher does not have access to subject, but allowing lesson plan creation'
        );
        // TODO: Uncomment this when teacher-subject relationships are properly set up
        // return NextResponse.json(
        //   { message: 'You do not have access to this subject' },
        //   { status: 403 }
        // );
      }
    }

    // Create lesson plan
    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        ...validatedData,
        classId:
          validatedData.classId === 'none' ? null : validatedData.classId,
        subjectId:
          validatedData.subjectId === 'none' ? null : validatedData.subjectId,
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
        scheduledDate: validatedData.scheduledDate
          ? new Date(validatedData.scheduledDate)
          : null,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        resources: true,
      },
    });

    return NextResponse.json(lessonPlan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating lesson plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
