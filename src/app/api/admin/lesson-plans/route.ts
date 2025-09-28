import { authOptions, Role } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      ![Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const reviewStatus = searchParams.get('reviewStatus');
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const offset = (page - 1) * limit;

    // Build where clause based on user role
    const where: any = {};

    if (session.user.role === Role.SCHOOL_ADMIN) {
      where.schoolId = session.user.schoolId;
    }

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

    if (teacherId && teacherId !== 'all') {
      where.teacherId = teacherId;
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
          teacher: {
            select: {
              id: true,
              employeeId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
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
