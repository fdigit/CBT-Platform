import { authOptions } from '@/lib/auth';
import { calculateGPA } from '@/lib/grading';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        class: { select: { name: true, section: true } },
        school: { select: { name: true, logoUrl: true } },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const session_param = searchParams.get('session');
    const subjectId = searchParams.get('subjectId');

    const whereClause: any = {
      studentId: student.id,
      status: 'PUBLISHED',
    };

    if (term) whereClause.term = term;
    if (session_param) whereClause.session = session_param;
    if (subjectId) whereClause.subjectId = subjectId;

    const results = await prisma.academicResult.findMany({
      where: whereClause,
      include: {
        subject: { select: { name: true, code: true } },
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { session: 'desc' },
        { term: 'asc' },
        { subject: { name: 'asc' } },
      ],
    });

    const formattedResults = results.map(result => ({
      id: result.id,
      subject: result.subject.name,
      subjectCode: result.subject.code,
      term: result.term,
      session: result.session,
      caScore: result.caScore,
      examScore: result.examScore,
      totalScore: result.totalScore,
      actualGrade: result.actualGrade,
      targetedGrade: result.targetedGrade,
      gradePoint: result.gradePoint,
      remark: result.remark,
      scoresObtainable: result.scoresObtainable,
      scoresObtained: result.scoresObtained,
      average: result.average,
      teacherComment: result.teacherComment,
      hodComment: result.hodComment,
      principalComment: result.principalComment,
      teacher: result.teacher?.user.name,
      createdAt: result.createdAt,
    }));

    const gpaCalculation = calculateGPA(results as any);

    const classAverageResult =
      results.length > 0 && results[0].average
        ? results.reduce((sum, r) => sum + (r.average || 0), 0) / results.length
        : null;

    // Fetch available terms from TermSession table instead of published results
    // This allows students to see active terms even before results are published
    const availableTerms = await prisma.termSession.findMany({
      where: {
        schoolId: student.schoolId,
        isActive: true,
      },
      select: {
        term: true,
        session: true,
      },
      orderBy: [{ session: 'desc' }, { startDate: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      student: {
        name: session.user.name,
        regNumber: student.regNumber,
        class: `${student.class?.name}${student.class?.section ? ` ${student.class.section}` : ''}`,
        school: student.school.name,
      },
      results: formattedResults,
      gpa: gpaCalculation.gpa,
      totalGradePoints: gpaCalculation.totalGradePoints,
      numberOfSubjects: gpaCalculation.numberOfSubjects,
      classAverage: classAverageResult,
      availableTerms: availableTerms.map(item => ({
        term: item.term,
        session: item.session,
      })),
    });
  } catch (error) {
    console.error('Error fetching student academic results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
