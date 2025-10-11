import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const term = searchParams.get('term');
    const session_param = searchParams.get('session');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = {
      teacherId: teacher.id,
    };

    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (term) whereClause.term = term;
    if (session_param) whereClause.session = session_param;
    if (status) whereClause.status = status;

    const [results, totalCount] = await Promise.all([
      prisma.academicResult.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          subject: { select: { name: true, code: true } },
          class: { select: { name: true, section: true } },
        },
        orderBy: [
          { term: 'asc' },
          { session: 'desc' },
          { student: { user: { name: 'asc' } } },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.academicResult.count({ where: whereClause }),
    ]);

    const formattedResults = results.map(result => ({
      id: result.id,
      studentId: result.studentId,
      studentName: result.student.user.name,
      studentEmail: result.student.user.email,
      regNumber: result.student.regNumber,
      subject: result.subject.name,
      subjectCode: result.subject.code,
      className: `${result.class.name}${result.class.section ? ` ${result.class.section}` : ''}`,
      term: result.term,
      session: result.session,
      caScore: result.caScore,
      examScore: result.examScore,
      totalScore: result.totalScore,
      actualGrade: result.actualGrade,
      gradePoint: result.gradePoint,
      remark: result.remark,
      status: result.status,
      teacherComment: result.teacherComment,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));

    return NextResponse.json({
      results: formattedResults,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching academic results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('id');

    if (!resultId) {
      return NextResponse.json(
        { error: 'Result ID is required' },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const result = await prisma.academicResult.findFirst({
      where: {
        id: resultId,
        teacherId: teacher.id,
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Result not found or access denied' },
        { status: 404 }
      );
    }

    if (result.status === 'APPROVED' || result.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot delete approved or published results' },
        { status: 403 }
      );
    }

    await prisma.academicResult.delete({
      where: { id: resultId },
    });

    return NextResponse.json({
      success: true,
      message: 'Result deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting academic result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
