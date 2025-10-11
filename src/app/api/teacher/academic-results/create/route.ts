import { authOptions } from '@/lib/auth';
import { calculateGrade, DEFAULT_GRADING_SCALE } from '@/lib/grading';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      studentId,
      subjectId,
      classId,
      term,
      session: academicSession,
      caScore,
      examScore,
      teacherComment,
      targetedGrade,
    } = body;

    if (!studentId || !subjectId || !classId || !term || !academicSession) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (caScore === undefined || examScore === undefined) {
      return NextResponse.json(
        { error: 'CA score and Exam score are required' },
        { status: 400 }
      );
    }

    if (caScore < 0 || caScore > 40) {
      return NextResponse.json(
        { error: 'CA score must be between 0 and 40' },
        { status: 400 }
      );
    }

    if (examScore < 0 || examScore > 60) {
      return NextResponse.json(
        { error: 'Exam score must be between 0 and 60' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { school: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.schoolId !== teacher.schoolId) {
      return NextResponse.json(
        { error: 'Student does not belong to your school' },
        { status: 403 }
      );
    }

    if (student.classId !== classId) {
      return NextResponse.json(
        { error: 'Student does not belong to the specified class' },
        { status: 400 }
      );
    }

    const teacherSubject = await prisma.classSubject.findFirst({
      where: {
        teacherId: teacher.id,
        classId,
        subjectId,
      },
    });

    if (!teacherSubject) {
      return NextResponse.json(
        {
          error:
            'You are not authorized to add results for this subject in this class',
        },
        { status: 403 }
      );
    }

    const totalScore = caScore + examScore;

    const gradingScales = await prisma.gradingScale.findMany({
      where: { schoolId: teacher.schoolId, isActive: true },
      orderBy: { minScore: 'desc' },
    });

    const gradingScale =
      gradingScales.length > 0
        ? gradingScales.map(scale => ({
            minScore: scale.minScore,
            maxScore: scale.maxScore,
            grade: scale.grade,
            gradePoint: scale.gradePoint,
            remark: scale.remark,
          }))
        : DEFAULT_GRADING_SCALE;

    const gradeResult = calculateGrade(totalScore, 100, gradingScale);

    const academicResult = await prisma.academicResult.upsert({
      where: {
        studentId_subjectId_term_session: {
          studentId,
          subjectId,
          term,
          session: academicSession,
        },
      },
      update: {
        caScore,
        examScore,
        totalScore,
        actualGrade: gradeResult.actualGrade,
        gradePoint: gradeResult.gradePoint,
        remark: gradeResult.remark,
        scoresObtained: totalScore,
        teacherComment,
        targetedGrade,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        subjectId,
        teacherId: teacher.id,
        classId,
        schoolId: teacher.schoolId,
        term,
        session: academicSession,
        caScore,
        examScore,
        totalScore,
        actualGrade: gradeResult.actualGrade,
        gradePoint: gradeResult.gradePoint,
        remark: gradeResult.remark,
        scoresObtainable: 100,
        scoresObtained: totalScore,
        teacherComment,
        targetedGrade,
        status: 'DRAFT',
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        subject: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Academic result saved successfully',
      result: academicResult,
    });
  } catch (error) {
    console.error('Error creating academic result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
