import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        class: { select: { name: true, section: true } },
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: 'Student profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const whereClause: any = {
      studentId: student.id,
    };

    if (subjectId) {
      whereClause.exam = {
        subjectId: subjectId,
      };
    }

    if (dateFrom || dateTo) {
      whereClause.gradedAt = {};
      if (dateFrom) {
        whereClause.gradedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.gradedAt.lte = new Date(dateTo);
      }
    }

    // Get all results for analytics
    const results = await prisma.result.findMany({
      where: whereClause,
      include: {
        exam: {
          include: {
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { gradedAt: 'asc' },
    });

    // Calculate analytics
    const totalResults = results.length;
    const totalExams = new Set(results.map(r => r.examId)).size;

    // Grade distribution
    const gradeDistribution = results.reduce(
      (acc, result) => {
        const percentage = result.exam.totalMarks
          ? (result.score / result.exam.totalMarks) * 100
          : 0;
        const grade = calculateGrade(result.score, result.exam.totalMarks || 0);
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Subject performance over time
    const subjectPerformance = results.reduce(
      (acc, result) => {
        const subjectName = result.exam.subject?.name || 'General';
        if (!acc[subjectName]) {
          acc[subjectName] = [];
        }
        const percentage = result.exam.totalMarks
          ? (result.score / result.exam.totalMarks) * 100
          : 0;
        acc[subjectName].push({
          examTitle: result.exam.title,
          score: result.score,
          totalMarks: result.exam.totalMarks || 0,
          percentage: Math.round(percentage * 100) / 100,
          grade: calculateGrade(result.score, result.exam.totalMarks || 0),
          examDate: result.exam.startTime,
          gradedAt: result.gradedAt,
        });
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Format subject performance with trends
    const formattedSubjectPerformance = Object.entries(subjectPerformance).map(
      ([subject, exams]) => {
        const sortedExams = exams.sort(
          (a, b) =>
            new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
        );
        const averageScore =
          exams.reduce((sum, exam) => sum + exam.percentage, 0) / exams.length;
        const latestScore =
          sortedExams[sortedExams.length - 1]?.percentage || 0;
        const firstScore = sortedExams[0]?.percentage || 0;
        const trend = latestScore - firstScore;

        return {
          subject,
          averageScore: Math.round(averageScore * 100) / 100,
          latestScore: Math.round(latestScore * 100) / 100,
          trend: Math.round(trend * 100) / 100,
          totalExams: exams.length,
          exams: sortedExams,
        };
      }
    );

    // Overall statistics
    const totalMarks = results.reduce(
      (sum, r) => sum + (r.exam.totalMarks || 0),
      0
    );
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

    const passedResults = results.filter(r => {
      const percentage = r.exam.totalMarks
        ? (r.score / r.exam.totalMarks) * 100
        : 0;
      return percentage >= 50; // Assuming 50% is passing
    });

    const passRate =
      totalResults > 0 ? (passedResults.length / totalResults) * 100 : 0;

    // Performance trend over time
    const performanceTrend = results
      .map(result => {
        const percentage = result.exam.totalMarks
          ? (result.score / result.exam.totalMarks) * 100
          : 0;
        return {
          examTitle: result.exam.title,
          subject: result.exam.subject?.name || 'General',
          score: result.score,
          totalMarks: result.exam.totalMarks || 0,
          percentage: Math.round(percentage * 100) / 100,
          grade: calculateGrade(result.score, result.exam.totalMarks || 0),
          examDate: result.exam.startTime,
          gradedAt: result.gradedAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
      );

    return NextResponse.json({
      overview: {
        totalResults,
        totalExams,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
      },
      gradeDistribution,
      subjectPerformance: formattedSubjectPerformance,
      performanceTrend,
    });
  } catch (error) {
    console.error('Error fetching student results analytics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate grade
function calculateGrade(score: number, totalMarks: number): string {
  if (totalMarks === 0) return 'N/A';

  const percentage = (score / totalMarks) * 100;

  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
}
