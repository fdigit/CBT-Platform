import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@/lib/auth';

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
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause based on user role
    const where: any = {};

    if (session.user.role === Role.SCHOOL_ADMIN) {
      where.schoolId = session.user.schoolId;
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

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Get overall statistics
    const [
      totalLessonPlans,
      pendingReviews,
      approvedLessonPlans,
      rejectedLessonPlans,
      needsRevisionLessonPlans,
      draftLessonPlans,
      publishedLessonPlans,
      archivedLessonPlans,
    ] = await Promise.all([
      prisma.lessonPlan.count({ where }),
      prisma.lessonPlan.count({ where: { ...where, reviewStatus: 'PENDING' } }),
      prisma.lessonPlan.count({
        where: { ...where, reviewStatus: 'APPROVED' },
      }),
      prisma.lessonPlan.count({
        where: { ...where, reviewStatus: 'REJECTED' },
      }),
      prisma.lessonPlan.count({
        where: { ...where, reviewStatus: 'NEEDS_REVISION' },
      }),
      prisma.lessonPlan.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.lessonPlan.count({ where: { ...where, status: 'PUBLISHED' } }),
      prisma.lessonPlan.count({ where: { ...where, status: 'ARCHIVED' } }),
    ]);

    // Get review status distribution
    const reviewStatusDistribution = await prisma.lessonPlan.groupBy({
      by: ['reviewStatus'],
      where,
      _count: true,
    });

    // Get status distribution
    const statusDistribution = await prisma.lessonPlan.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Get teacher performance
    const teacherPerformance = await prisma.lessonPlan.groupBy({
      by: ['teacherId'],
      where,
      _count: {
        id: true,
      },
      _avg: {
        duration: true,
      },
    });

    // Get teacher details for performance
    const teacherIds = teacherPerformance.map(t => t.teacherId);
    const teachers = await prisma.teacher.findMany({
      where: {
        id: { in: teacherIds },
      },
      select: {
        id: true,
        employeeId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const teacherPerformanceWithDetails = teacherPerformance.map(perf => {
      const teacher = teachers.find(t => t.id === perf.teacherId);
      return {
        teacherId: perf.teacherId,
        teacherName: teacher?.user.name || 'Unknown',
        employeeId: teacher?.employeeId || 'Unknown',
        totalLessonPlans: perf._count.id,
        averageDuration: perf._avg.duration || 0,
      };
    });

    // Get subject performance
    const subjectPerformance = await prisma.lessonPlan.groupBy({
      by: ['subjectId'],
      where: {
        ...where,
        subjectId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Get subject details for performance
    const subjectIds = subjectPerformance
      .map(s => s.subjectId)
      .filter((id): id is string => id !== null);
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: subjectIds },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    const subjectPerformanceWithDetails = subjectPerformance.map(perf => {
      const subject = subjects.find(s => s.id === perf.subjectId);
      return {
        subjectId: perf.subjectId,
        subjectName: subject?.name || 'Unknown',
        subjectCode: subject?.code || 'Unknown',
        totalLessonPlans: perf._count.id,
      };
    });

    // Get class performance
    const classPerformance = await prisma.lessonPlan.groupBy({
      by: ['classId'],
      where: {
        ...where,
        classId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Get class details for performance
    const classIds = classPerformance
      .map(c => c.classId)
      .filter((id): id is string => id !== null);
    const classes = await prisma.class.findMany({
      where: {
        id: { in: classIds },
      },
      select: {
        id: true,
        name: true,
        section: true,
      },
    });

    const classPerformanceWithDetails = classPerformance.map(perf => {
      const classData = classes.find(c => c.id === perf.classId);
      return {
        classId: perf.classId,
        className: classData?.name || 'Unknown',
        classSection: classData?.section || 'Unknown',
        totalLessonPlans: perf._count.id,
      };
    });

    // Calculate approval rate
    const approvalRate =
      totalLessonPlans > 0 ? (approvedLessonPlans / totalLessonPlans) * 100 : 0;

    // Calculate submission rate (published vs total)
    const submissionRate =
      totalLessonPlans > 0
        ? (publishedLessonPlans / totalLessonPlans) * 100
        : 0;

    return NextResponse.json({
      overview: {
        totalLessonPlans,
        pendingReviews,
        approvedLessonPlans,
        rejectedLessonPlans,
        needsRevisionLessonPlans,
        draftLessonPlans,
        publishedLessonPlans,
        archivedLessonPlans,
        approvalRate: Math.round(approvalRate * 100) / 100,
        submissionRate: Math.round(submissionRate * 100) / 100,
      },
      reviewStatusDistribution: reviewStatusDistribution.map(item => ({
        status: item.reviewStatus,
        count: item._count,
      })),
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        count: item._count,
      })),
      teacherPerformance: teacherPerformanceWithDetails.sort(
        (a, b) => b.totalLessonPlans - a.totalLessonPlans
      ),
      subjectPerformance: subjectPerformanceWithDetails.sort(
        (a, b) => b.totalLessonPlans - a.totalLessonPlans
      ),
      classPerformance: classPerformanceWithDetails.sort(
        (a, b) => b.totalLessonPlans - a.totalLessonPlans
      ),
    });
  } catch (error) {
    console.error('Error fetching lesson plan analytics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
