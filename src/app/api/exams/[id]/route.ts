import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { examSchema, questionSchema } from '@/lib/validations';

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
      include: {
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
    const { exam, questions } = body;

    // Validate exam data
    const validatedExam = examSchema.parse(exam);

    // Validate questions (handle both 'text' and 'question' field names)
    const validatedQuestions = questions.map((q: any) => {
      // Basic validation and field mapping
      const questionForValidation = {
        text: q.text || q.question || '',
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        order: q.order,
        imageUrl: q.imageUrl,
        audioUrl: q.audioUrl,
        videoUrl: q.videoUrl,
        explanation: q.explanation,
        difficulty: q.difficulty || 'MEDIUM',
        tags: q.tags,
      };

      // Basic validation without using Zod schema to avoid null issues
      if (
        !questionForValidation.text ||
        questionForValidation.text.length < 3
      ) {
        throw new Error('Question text must be at least 3 characters');
      }

      if (!questionForValidation.type) {
        throw new Error('Question type is required');
      }

      return questionForValidation;
    });

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

    // Update exam and questions in a transaction
    const result = await prisma.$transaction(async tx => {
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
          subjectId:
            validatedExam.subjectId === 'general'
              ? null
              : validatedExam.subjectId,
          classId:
            validatedExam.classId === 'all' ? null : validatedExam.classId,
        },
      });

      // Delete existing questions
      await tx.question.deleteMany({
        where: { examId: examId },
      });

      // Create new questions
      const createdQuestions = await Promise.all(
        validatedQuestions.map((question: any, index: number) =>
          tx.question.create({
            data: {
              text: question.text,
              type: question.type,
              options: question.options || null,
              correctAnswer: question.correctAnswer || null,
              points: question.points,
              order: question.order || index + 1,
              imageUrl: question.imageUrl,
              audioUrl: question.audioUrl,
              videoUrl: question.videoUrl,
              explanation: question.explanation,
              difficulty: question.difficulty || 'MEDIUM',
              tags: question.tags || null,
              examId: examId,
            },
          })
        )
      );

      return { exam: updatedExam, questions: createdQuestions };
    });

    return NextResponse.json({
      message: 'Exam updated successfully',
      exam: result.exam,
      questionsCount: result.questions.length,
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
