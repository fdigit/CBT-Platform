import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get overall exam statistics
    const totalExams = await prisma.exam.count();

    // Get exams by status
    const now = new Date();
    const [activeExams, scheduledExams, closedExams] = await Promise.all([
      prisma.exam.count({
        where: {
          AND: [{ startTime: { lte: now } }, { endTime: { gte: now } }],
        },
      }),
      prisma.exam.count({
        where: {
          startTime: {
            gt: now,
          },
        },
      }),
      prisma.exam.count({
        where: {
          endTime: {
            lt: now,
          },
        },
      }),
    ]);

    // Get exams by school
    const examsBySchool = await prisma.exam.groupBy({
      by: ['schoolId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get school names for the top schools
    const topSchoolIds = examsBySchool.map(item => item.schoolId);
    const schools = await prisma.school.findMany({
      where: {
        id: {
          in: topSchoolIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const topSchoolsWithNames = examsBySchool.map(item => {
      const school = schools.find(s => s.id === item.schoolId);
      return {
        schoolId: item.schoolId,
        schoolName: school?.name || 'Unknown School',
        examCount: item._count.id,
      };
    });

    // Get most popular subjects (we'll need to add subject field to exam schema)
    // For now, we'll analyze question types as a proxy
    const questionTypes = await prisma.question.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    // Get upcoming exams (next 7 days)
    const upcomingExams = await prisma.exam.findMany({
      where: {
        startTime: {
          gte: now,
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
            results: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
    });

    // Get exam creation trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const examTrend = await prisma.exam.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
    });

    // Group by month
    const monthlyTrend = examTrend.reduce((acc: any, exam) => {
      const month = new Date(exam.createdAt).toISOString().slice(0, 7); // YYYY-MM format
      acc[month] = (acc[month] || 0) + exam._count.id;
      return acc;
    }, {});

    const analytics = {
      summary: {
        totalExams,
        activeExams,
        scheduledExams,
        closedExams,
        pendingApprovals: 0, // We'll implement this when we add approval status to schema
      },
      topSchools: topSchoolsWithNames,
      questionTypeDistribution: questionTypes.map(qt => ({
        type: qt.type,
        count: qt._count.id,
      })),
      upcomingExams: upcomingExams.map(exam => ({
        id: exam.id,
        title: exam.title,
        schoolName: exam.school.name,
        startTime: exam.startTime,
        questionsCount: exam._count.questions,
        registeredStudents: exam._count.results,
      })),
      monthlyTrend: Object.entries(monthlyTrend)
        .map(([month, count]) => ({
          month,
          count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching exam analytics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
