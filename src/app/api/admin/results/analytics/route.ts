import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/types/models';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (![Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const teacherId = searchParams.get('teacherId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const whereClause: any = {};

    if (session.user.role === Role.SCHOOL_ADMIN) {
      whereClause.exam = {
        schoolId: session.user.schoolId,
      };
    }

    if (classId) {
      whereClause.student = {
        ...whereClause.student,
        classId: classId,
      };
    }

    if (subjectId) {
      whereClause.exam = {
        ...whereClause.exam,
        subjectId: subjectId,
      };
    }

    if (teacherId) {
      whereClause.exam = {
        ...whereClause.exam,
        teacherId: teacherId,
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
            teacher: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
        student: {
          include: {
            class: { select: { name: true, section: true } },
          },
        },
      },
    });

    // Calculate analytics
    const totalResults = results.length;
    const totalStudents = new Set(results.map(r => r.studentId)).size;
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

    // Subject performance
    const subjectPerformance = results.reduce(
      (acc, result) => {
        const subjectName = result.exam.subject?.name || 'General';
        if (!acc[subjectName]) {
          acc[subjectName] = {
            totalScore: 0,
            totalMarks: 0,
            count: 0,
            students: new Set(),
          };
        }
        acc[subjectName].totalScore += result.score;
        acc[subjectName].totalMarks += result.exam.totalMarks || 0;
        acc[subjectName].count += 1;
        acc[subjectName].students.add(result.studentId);
        return acc;
      },
      {} as Record<string, any>
    );

    // Format subject performance
    const formattedSubjectPerformance = Object.entries(subjectPerformance).map(
      ([subject, data]) => ({
        subject,
        averageScore:
          data.totalMarks > 0 ? (data.totalScore / data.totalMarks) * 100 : 0,
        totalStudents: data.students.size,
        totalExams: data.count,
      })
    );

    // Teacher performance
    const teacherPerformance = results.reduce(
      (acc, result) => {
        const teacherName = result.exam.teacher?.user.name || 'Unknown';
        if (!acc[teacherName]) {
          acc[teacherName] = {
            totalScore: 0,
            totalMarks: 0,
            count: 0,
            students: new Set(),
          };
        }
        acc[teacherName].totalScore += result.score;
        acc[teacherName].totalMarks += result.exam.totalMarks || 0;
        acc[teacherName].count += 1;
        acc[teacherName].students.add(result.studentId);
        return acc;
      },
      {} as Record<string, any>
    );

    // Format teacher performance
    const formattedTeacherPerformance = Object.entries(teacherPerformance).map(
      ([teacher, data]) => ({
        teacher,
        averageScore:
          data.totalMarks > 0 ? (data.totalScore / data.totalMarks) * 100 : 0,
        totalStudents: data.students.size,
        totalExams: data.count,
      })
    );

    // Class performance
    const classPerformance = results.reduce(
      (acc, result) => {
        const className = result.student.class
          ? `${result.student.class.name} ${result.student.class.section || ''}`
          : 'N/A';
        if (!acc[className]) {
          acc[className] = {
            totalScore: 0,
            totalMarks: 0,
            count: 0,
            students: new Set(),
          };
        }
        acc[className].totalScore += result.score;
        acc[className].totalMarks += result.exam.totalMarks || 0;
        acc[className].count += 1;
        acc[className].students.add(result.studentId);
        return acc;
      },
      {} as Record<string, any>
    );

    // Format class performance
    const formattedClassPerformance = Object.entries(classPerformance).map(
      ([className, data]) => ({
        className,
        averageScore:
          data.totalMarks > 0 ? (data.totalScore / data.totalMarks) * 100 : 0,
        totalStudents: data.students.size,
        totalExams: data.count,
      })
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

    return NextResponse.json({
      overview: {
        totalResults,
        totalStudents,
        totalExams,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
      },
      gradeDistribution,
      subjectPerformance: formattedSubjectPerformance,
      teacherPerformance: formattedTeacherPerformance,
      classPerformance: formattedClassPerformance,
    });
  } catch (error) {
    console.error('Error fetching admin results analytics:', error);
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
