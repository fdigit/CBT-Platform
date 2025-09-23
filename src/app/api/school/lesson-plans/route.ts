import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get school admin profile
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id },
      include: { school: true },
    });

    if (!schoolAdmin) {
      return NextResponse.json(
        { error: 'School admin profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const reviewStatus = searchParams.get('reviewStatus');
    const subject = searchParams.get('subject');
    const teacherId = searchParams.get('teacherId');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      schoolId: schoolAdmin.schoolId,
      status: 'PUBLISHED', // Only show published lesson plans for review
    };

    if (reviewStatus && reviewStatus !== 'all') {
      where.reviewStatus = reviewStatus;
    }

    if (subject && subject !== 'all') {
      where.subject = {
        name: subject,
      };
    }

    if (teacherId && teacherId !== 'all') {
      where.teacherId = teacherId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        {
          teacher: {
            user: { name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    // Get lesson plans with pagination
    const [lessonPlans, totalCount] = await Promise.all([
      prisma.lessonPlan.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              user: {
                select: { name: true },
              },
            },
          },
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
        orderBy: [
          { reviewStatus: 'asc' }, // Pending first
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lessonPlan.count({ where }),
    ]);

    // Get summary statistics
    const stats = await prisma.lessonPlan.groupBy({
      by: ['reviewStatus'],
      where: {
        schoolId: schoolAdmin.schoolId,
        status: 'PUBLISHED',
      },
      _count: true,
    });

    const summaryStats = {
      pending: stats.find(s => s.reviewStatus === 'PENDING')?._count || 0,
      approved: stats.find(s => s.reviewStatus === 'APPROVED')?._count || 0,
      rejected: stats.find(s => s.reviewStatus === 'REJECTED')?._count || 0,
      needsRevision:
        stats.find(s => s.reviewStatus === 'NEEDS_REVISION')?._count || 0,
      total: stats.reduce((sum, s) => sum + s._count, 0),
    };

    return NextResponse.json({
      lessonPlans,
      stats: summaryStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching lesson plans for review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson plans' },
      { status: 500 }
    );
  }
}
