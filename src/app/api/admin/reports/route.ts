import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'last30days';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'last12months':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Execute queries in parallel without transaction to avoid timeout
    const [
      // Basic counts
      totalSchools,
      totalUsers,
      totalExams,
      totalStudents,
      activeSchools,
      activeExams,
      completedExams,
      scheduledExams,

      // Revenue data
      monthlyRevenue,

      // Chart data
      examsPerSchool,
      schoolsByStatus,

      // Recent activities
      recentRegistrations,
      recentSchools,
      recentExams,

      // Performance data
      averageScores,
    ] = await Promise.all([
      // Basic counts
      prisma.school.count(),
      prisma.user.count(),
      prisma.exam.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.school.count({ where: { status: 'APPROVED' } }),
      prisma.exam.count({
        where: {
          startTime: { lte: now },
          endTime: { gte: now },
        },
      }),
      prisma.exam.count({
        where: {
          endTime: { lt: now },
        },
      }),
      prisma.exam.count({
        where: {
          startTime: { gt: now },
        },
      }),

      // Revenue Statistics
      prisma.payment
        .aggregate({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
          _count: true,
        })
        .catch(() => ({ _sum: { amount: 0 }, _count: 0 })),

      // Exams per School
      prisma.school.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              exams: true,
            },
          },
        },
        orderBy: {
          exams: {
            _count: 'desc',
          },
        },
        take: 10,
      }),

      // Schools by Status
      prisma.school.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),

      // Recent registrations
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          name: true,
          role: true,
          createdAt: true,
          school: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Recent school approvals
      prisma.school.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      }),

      // Recent exams created
      prisma.exam.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          school: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Performance Metrics
      prisma.result
        .aggregate({
          _avg: {
            score: true,
          },
          where: {
            gradedAt: { gte: startDate },
          },
        })
        .catch(() => ({ _avg: { score: 0 } })),
    ]);

    // User Role Distribution (separate parallel queries)
    const [superAdmins, schoolAdmins, students] = await Promise.all([
      prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      prisma.user.count({ where: { role: 'SCHOOL_ADMIN' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
    ]);

    const userRoleData = [
      { name: 'Super Admins', value: superAdmins, color: '#ef4444' },
      { name: 'School Admins', value: schoolAdmins, color: '#3b82f6' },
      { name: 'Students', value: students, color: '#10b981' },
    ];

    // User Growth Over Time (optimized with fewer months to avoid timeout)
    const userGrowthData = [];
    const monthlyPromises = [];

    for (let i = 5; i >= 0; i--) {
      // Reduced from 12 to 6 months
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      monthlyPromises.push(
        prisma.user
          .count({
            where: {
              createdAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          })
          .then(count => ({
            month: monthStart.toLocaleString('default', { month: 'short' }),
            users: count,
            date: monthStart,
          }))
      );
    }

    const monthlyResults = await Promise.all(monthlyPromises);
    userGrowthData.push(...monthlyResults);

    const reports = {
      summary: {
        totalSchools,
        totalUsers,
        totalExams,
        totalStudents,
        activeSchools,
        activeExams,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        monthlyPayments: monthlyRevenue._count,
      },
      charts: {
        userGrowth: userGrowthData,
        examsPerSchool: examsPerSchool.map(school => ({
          name: school.name,
          exams: school._count.exams,
        })),
        userRoleDistribution: userRoleData,
        schoolsByStatus: schoolsByStatus.map(status => ({
          name: status.status,
          value: status._count.id,
        })),
      },
      activities: {
        recentRegistrations,
        recentSchools,
        recentExams,
      },
      analytics: {
        exam: {
          totalExams,
          activeExams,
          completedExams,
          scheduledExams,
        },
        performance: {
          averageScore: averageScores._avg.score || 0,
        },
      },
      insights: {
        topPerformingSchools: examsPerSchool.slice(0, 5),
        growthTrend:
          userGrowthData.length > 1
            ? ((userGrowthData[userGrowthData.length - 1].users -
                userGrowthData[userGrowthData.length - 2].users) /
                Math.max(userGrowthData[userGrowthData.length - 2].users, 1)) *
              100
            : 0,
        alerts: [],
      },
    };

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
