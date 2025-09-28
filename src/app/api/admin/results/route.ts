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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const teacherId = searchParams.get('teacherId');
    const examType = searchParams.get('examType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const grade = searchParams.get('grade');

    // Build where clause based on user role
    const whereClause: any = {};

    if (session.user.role === Role.SCHOOL_ADMIN) {
      whereClause.exam = {
        schoolId: session.user.schoolId,
      };
    }

    // Add filters
    if (search) {
      whereClause.OR = [
        {
          student: {
            user: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          student: {
            regNumber: { contains: search, mode: 'insensitive' },
          },
        },
        {
          exam: {
            title: { contains: search, mode: 'insensitive' },
          },
        },
      ];
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

    // Get results with pagination
    const [results, totalCount] = await Promise.all([
      prisma.result.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true, section: true } },
            },
          },
          exam: {
            include: {
              subject: { select: { name: true, code: true } },
              teacher: {
                include: {
                  user: { select: { name: true } },
                },
              },
              class: { select: { name: true, section: true } },
            },
          },
        },
        orderBy: { gradedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.result.count({ where: whereClause }),
    ]);

    // Format results with additional calculated fields
    const formattedResults = results.map(result => {
      const percentage = result.exam.totalMarks
        ? (result.score / result.exam.totalMarks) * 100
        : 0;
      const passed = result.exam.passingMarks
        ? result.score >= result.exam.passingMarks
        : result.score > 0;
      const grade = calculateGrade(result.score, result.exam.totalMarks || 0);

      return {
        id: result.id,
        studentName: result.student.user.name,
        admissionNumber: result.student.regNumber,
        class: result.student.class
          ? `${result.student.class.name} ${result.student.class.section || ''}`
          : 'N/A',
        subject: result.exam.subject?.name || 'General',
        examTitle: result.exam.title,
        score: result.score,
        totalMarks: result.exam.totalMarks || 0,
        percentage: Math.round(percentage * 100) / 100,
        grade,
        passed,
        teacher: result.exam.teacher?.user.name || 'N/A',
        examDate: result.exam.startTime,
        gradedAt: result.gradedAt,
        examId: result.exam.id,
        studentId: result.student.id,
      };
    });

    // Apply grade filter after calculation
    const filteredResults = grade
      ? formattedResults.filter(result => result.grade === grade)
      : formattedResults;

    return NextResponse.json({
      results: filteredResults,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin results:', error);
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
