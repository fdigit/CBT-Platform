import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { examSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const examId = id;
    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      );
    }

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: schoolId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        duration: true,
        shuffle: true,
        negativeMarking: true,
        isLive: true,
        maxAttempts: true,
        questions: {
          orderBy: {
            id: 'asc',
          },
        },
        school: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            results: true,
            answers: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const examId = id;
    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('PUT request body:', body);
    const { exam } = body;

    console.log('Exam data before validation:', exam);

    // Validate exam data
    let validatedExam;
    try {
      validatedExam = examSchema.parse(exam);
      console.log('Validated exam data:', validatedExam);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { message: 'Validation failed', error: validationError },
        { status: 400 }
      );
    }

    // Questions are not being updated in this endpoint

    // Check if exam exists and belongs to the school
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: schoolId,
      },
    });

    if (!existingExam) {
      return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
    }

    // Update exam and questions in a transaction with increased timeout
    console.log('Starting database transaction...');
    let result;
    try {
      result = await prisma.$transaction(async tx => {
        console.log('Inside transaction, updating exam...');
        // Update exam
        const updatedExam = await tx.exam.update({
          where: { id: examId },
          data: {
            title: validatedExam.title,
            description: validatedExam.description,
            startTime: new Date(validatedExam.startTime),
            endTime: new Date(validatedExam.endTime),
            duration: validatedExam.duration,
            shuffle: validatedExam.shuffle,
            negativeMarking: validatedExam.negativeMarking,
            totalMarks: validatedExam.totalMarks,
            passingMarks: validatedExam.passingMarks,
            allowPreview: validatedExam.allowPreview,
            showResultsImmediately: validatedExam.showResultsImmediately,
            maxAttempts: validatedExam.maxAttempts,
            isLive: validatedExam.isLive,
            subjectId:
              validatedExam.subjectId === 'general'
                ? null
                : validatedExam.subjectId,
            classId:
              validatedExam.classId === 'all' ? null : validatedExam.classId,
          },
        });

        // Only return the updated exam - no need to recreate questions
        return { exam: updatedExam };
      });
      console.log('Transaction completed successfully');
    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { message: 'Database transaction failed', error: transactionError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Exam updated successfully',
      exam: result.exam,
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { message: 'Failed to update exam' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const examId = id;
    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      );
    }

    // Check if exam exists and belongs to the school
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: schoolId,
      },
    });

    if (!existingExam) {
      return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
    }

    // Delete exam and related data in a transaction
    await prisma.$transaction(async tx => {
      // Delete answers
      await tx.answer.deleteMany({
        where: { examId: examId },
      });

      // Delete results
      await tx.result.deleteMany({
        where: { examId: examId },
      });

      // Delete questions
      await tx.question.deleteMany({
        where: { examId: examId },
      });

      // Delete exam
      await tx.exam.delete({
        where: { id: examId },
      });
    });

    return NextResponse.json({
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { message: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}
