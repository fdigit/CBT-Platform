import { authOptions } from '@/lib/auth';
import { calculateGPA, calculatePassRate } from '@/lib/grading';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const classId = searchParams.get('classId');
    const term = searchParams.get('term');
    const session_param = searchParams.get('session');

    const whereClause: any = {
      status: 'PUBLISHED',
    };

    if (session.user.role === 'SCHOOL_ADMIN') {
      whereClause.schoolId = session.user.schoolId;
    } else if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (classId) whereClause.classId = classId;
    if (term) whereClause.term = term;
    if (session_param) whereClause.session = session_param;

    const results = await prisma.academicResult.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        subject: { select: { name: true, id: true } },
        class: { select: { name: true, section: true } },
      },
    });

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No published results found',
        analytics: {
          totalResults: 0,
          totalStudents: 0,
          averageGPA: 0,
          passRate: 0,
          topPerformers: [],
          subjectPerformance: [],
          classPerformance: [],
          gradeDistribution: [],
        },
      });
    }

    const totalResults = results.length;
    const uniqueStudents = Array.from(new Set(results.map(r => r.studentId)));
    const totalStudents = uniqueStudents.length;

    const studentGPAs: { [key: string]: number } = {};
    for (const studentId of uniqueStudents) {
      const studentResults = results.filter(r => r.studentId === studentId);
      const gpaCalc = calculateGPA(studentResults as any);
      studentGPAs[studentId] = gpaCalc.gpa;
    }

    const averageGPA =
      Object.values(studentGPAs).reduce((sum, gpa) => sum + gpa, 0) /
      totalStudents;
    const passRate = calculatePassRate(results as any);

    const topPerformers = Object.entries(studentGPAs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([studentId, gpa]) => {
        const student = results.find(r => r.studentId === studentId)?.student;
        return {
          studentId,
          studentName: student?.user.name || 'Unknown',
          gpa: Math.round(gpa * 100) / 100,
        };
      });

    const subjectStats: {
      [key: string]: {
        name: string;
        scores: number[];
        total: number;
        passed: number;
      };
    } = {};
    for (const result of results) {
      const subjectId = result.subject.id;
      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = {
          name: result.subject.name,
          scores: [],
          total: 0,
          passed: 0,
        };
      }
      subjectStats[subjectId].scores.push(result.totalScore);
      subjectStats[subjectId].total++;
      if (result.totalScore >= 40) {
        subjectStats[subjectId].passed++;
      }
    }

    const subjectPerformance = Object.values(subjectStats).map(stat => ({
      subjectName: stat.name,
      average:
        Math.round(
          (stat.scores.reduce((sum, s) => sum + s, 0) / stat.scores.length) *
            100
        ) / 100,
      passRate: Math.round((stat.passed / stat.total) * 100 * 100) / 100,
      totalResults: stat.total,
    }));

    const classStats: {
      [key: string]: {
        name: string;
        scores: number[];
        total: number;
        passed: number;
      };
    } = {};
    for (const result of results) {
      const className = `${result.class.name}${result.class.section ? ` ${result.class.section}` : ''}`;
      if (!classStats[className]) {
        classStats[className] = {
          name: className,
          scores: [],
          total: 0,
          passed: 0,
        };
      }
      classStats[className].scores.push(result.totalScore);
      classStats[className].total++;
      if (result.totalScore >= 40) {
        classStats[className].passed++;
      }
    }

    const classPerformance = Object.values(classStats).map(stat => ({
      className: stat.name,
      average:
        Math.round(
          (stat.scores.reduce((sum, s) => sum + s, 0) / stat.scores.length) *
            100
        ) / 100,
      passRate: Math.round((stat.passed / stat.total) * 100 * 100) / 100,
      totalResults: stat.total,
    }));

    const gradeCount: { [key: string]: number } = {};
    for (const result of results) {
      gradeCount[result.actualGrade] =
        (gradeCount[result.actualGrade] || 0) + 1;
    }

    const gradeDistribution = Object.entries(gradeCount)
      .map(([grade, count]) => ({
        grade,
        count,
        percentage: Math.round((count / totalResults) * 100 * 100) / 100,
      }))
      .sort((a, b) => {
        const gradeOrder = ['A*', 'A', 'B+', 'B', 'C', 'D', 'F'];
        return gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
      });

    return NextResponse.json({
      success: true,
      analytics: {
        totalResults,
        totalStudents,
        averageGPA: Math.round(averageGPA * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        topPerformers,
        subjectPerformance,
        classPerformance,
        gradeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
