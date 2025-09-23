import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canSaveAnswers } from '@/lib/exam-status';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: examId } = await params;

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, response, attemptId } = body;

    if (!questionId || !attemptId) {
      return NextResponse.json(
        {
          error: 'Question ID and attempt ID are required',
        },
        { status: 400 }
      );
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Verify the attempt belongs to the student and is active
    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        examId,
        studentId: student.id,
        status: 'IN_PROGRESS',
      },
    });

    if (!attempt) {
      return NextResponse.json(
        {
          error: 'Invalid or inactive exam attempt',
        },
        { status: 400 }
      );
    }

    // Verify the question belongs to the exam
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        examId,
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          error: 'Question not found in this exam',
        },
        { status: 400 }
      );
    }

    // Get exam with attempts and results for status calculation
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        attempts: {
          where: { studentId: student.id },
          orderBy: { startedAt: 'desc' },
        },
        results: {
          where: { studentId: student.id },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Use relaxed logic to check if answers can be saved
    const now = new Date();
    const canSave = canSaveAnswers(
      {
        id: exam.id,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        maxAttempts: exam.maxAttempts,
        manualControl: exam.manualControl,
        isLive: exam.isLive,
        isCompleted: exam.isCompleted,
        status: exam.status,
        attempts: exam.attempts,
        results: exam.results,
      },
      now
    );

    if (!canSave) {
      return NextResponse.json(
        {
          error:
            'Cannot save answers at this time. Exam may be completed or not yet started.',
        },
        { status: 400 }
      );
    }

    // Auto-grade the answer for objective questions
    let isCorrect = null;
    let pointsAwarded = 0;
    let studentAnswer = response; // Default to original response

    if (['MCQ', 'TRUE_FALSE'].includes(question.type) && response) {
      const correctAnswer = question.correctAnswer;

      // For MCQ, convert index to actual option value if needed
      if (
        question.type === 'MCQ' &&
        question.options &&
        Array.isArray(question.options)
      ) {
        const optionIndex = parseInt(response);
        if (
          !isNaN(optionIndex) &&
          optionIndex >= 0 &&
          optionIndex < question.options.length
        ) {
          studentAnswer = question.options[optionIndex];
        }
      }

      // Compare the actual option value with correct answer
      if (
        correctAnswer &&
        typeof correctAnswer === 'object' &&
        'answer' in correctAnswer
      ) {
        isCorrect = studentAnswer === (correctAnswer as any).answer;
      } else if (typeof correctAnswer === 'string') {
        isCorrect = studentAnswer === correctAnswer;
      }

      if (isCorrect) {
        pointsAwarded = question.points;
      } else if (exam.negativeMarking) {
        pointsAwarded = -question.points * 0.25; // 25% negative marking
      }
    }

    // Upsert the answer (update if exists, create if not)
    const answer = await prisma.answer.upsert({
      where: {
        studentId_questionId_examId: {
          studentId: student.id,
          questionId,
          examId,
        },
      },
      update: {
        response: studentAnswer || response, // Store the actual option value for MCQ
        isCorrect,
        pointsAwarded,
        updatedAt: now,
        attemptId,
      },
      create: {
        studentId: student.id,
        questionId,
        examId,
        attemptId,
        response: studentAnswer || response, // Store the actual option value for MCQ
        isCorrect,
        pointsAwarded,
      },
    });

    return NextResponse.json({
      message: 'Answer saved successfully',
      answer: {
        id: answer.id,
        questionId: answer.questionId,
        response: answer.response,
        isCorrect: answer.isCorrect,
        pointsAwarded: answer.pointsAwarded,
      },
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}
