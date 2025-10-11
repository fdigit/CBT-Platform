import { authOptions } from '@/lib/auth';
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
    const subjectId = searchParams.get('subjectId');
    const teacherId = searchParams.get('teacherId');
    const term = searchParams.get('term');
    const session_param = searchParams.get('session');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = {};

    if (session.user.role === 'SCHOOL_ADMIN') {
      whereClause.schoolId = session.user.schoolId;
    } else if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (teacherId) whereClause.teacherId = teacherId;
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
          teacher: {
            include: {
              user: { select: { name: true } },
            },
          },
          school: { select: { name: true } },
        },
        orderBy: [
          { status: 'asc' },
          { submittedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.academicResult.count({ where: whereClause }),
    ]);

    const statistics = await prisma.academicResult.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    const stats = {
      total: totalCount,
      draft: statistics.find(s => s.status === 'DRAFT')?._count || 0,
      submitted: statistics.find(s => s.status === 'SUBMITTED')?._count || 0,
      approved: statistics.find(s => s.status === 'APPROVED')?._count || 0,
      rejected: statistics.find(s => s.status === 'REJECTED')?._count || 0,
      published: statistics.find(s => s.status === 'PUBLISHED')?._count || 0,
    };

    const formattedResults = results.map(result => ({
      id: result.id,
      studentId: result.studentId,
      studentName: result.student.user.name,
      studentEmail: result.student.user.email,
      regNumber: result.student.regNumber,
      subject: result.subject.name,
      subjectCode: result.subject.code,
      className: `${result.class.name}${result.class.section ? ` ${result.class.section}` : ''}`,
      teacherName: result.teacher.user.name,
      schoolName: result.school.name,
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
      submittedAt: result.submittedAt,
      approvedAt: result.approvedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));

    return NextResponse.json({
      results: formattedResults,
      statistics: stats,
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
