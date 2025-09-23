import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { school: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const reviewStatus = searchParams.get('reviewStatus');
    const subject = searchParams.get('subject');
    const classId = searchParams.get('classId');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      teacherId: teacher.id,
      schoolId: teacher.schoolId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (reviewStatus && reviewStatus !== 'all') {
      where.reviewStatus = reviewStatus;
    }

    if (subject && subject !== 'all') {
      where.subject = {
        name: subject,
      };
    }

    if (classId && classId !== 'all') {
      where.classId = classId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get lesson plans with pagination
    const [lessonPlans, totalCount] = await Promise.all([
      prisma.lessonPlan.findMany({
        where,
        include: {
          subject: {
            select: { name: true, code: true },
          },
          class: {
            select: { name: true, section: true },
          },
          resources: true,
          reviewer: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lessonPlan.count({ where }),
    ]);

    return NextResponse.json({
      lessonPlans,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { school: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      topic,
      duration,
      objectives,
      materials,
      activities,
      assessment,
      homework,
      notes,
      scheduledDate,
      status,
      classId,
      subjectId,
      resources = [],
    } = body;

    // Validate required fields
    if (
      !title ||
      !topic ||
      !duration ||
      !objectives ||
      !materials ||
      !activities ||
      !assessment
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create lesson plan
    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        title,
        topic,
        duration,
        objectives,
        materials,
        activities,
        assessment,
        homework,
        notes,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: status || 'DRAFT',
        reviewStatus: status === 'PUBLISHED' ? 'PENDING' : 'PENDING',
        schoolId: teacher.schoolId,
        teacherId: teacher.id,
        classId: classId && classId !== 'all' ? classId : null,
        subjectId: subjectId && subjectId !== 'general' ? subjectId : null,
        resources: {
          create: resources.map((resource: any) => ({
            fileName: resource.fileName,
            originalName: resource.originalName,
            filePath: resource.filePath,
            fileSize: resource.fileSize,
            mimeType: resource.mimeType,
            resourceType: resource.resourceType || 'DOCUMENT',
          })),
        },
      },
      include: {
        subject: {
          select: { name: true, code: true },
        },
        class: {
          select: { name: true, section: true },
        },
        resources: true,
      },
    });

    return NextResponse.json({ lessonPlan }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson plan:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson plan' },
      { status: 500 }
    );
  }
}
