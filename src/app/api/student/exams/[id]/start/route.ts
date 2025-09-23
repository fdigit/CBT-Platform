import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Get exam details
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: student.schoolId,
        status: {
          in: ['PUBLISHED', 'APPROVED'],
        },
        OR: [{ classId: student.classId }, { classId: null }],
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            type: true,
            options: true,
            points: true,
            order: true,
            imageUrl: true,
            audioUrl: true,
            videoUrl: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found or not accessible' },
        { status: 404 }
      );
    }

    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    // Check if exam is currently active (considering manual control)
    if (exam.manualControl) {
      // Manual control enabled - check manual status
      if (!exam.isLive) {
        return NextResponse.json(
          {
            error: 'Exam is not currently live',
            startTime: exam.startTime,
          },
          { status: 400 }
        );
      }
      if (exam.isCompleted) {
        return NextResponse.json(
          {
            error: 'Exam has been completed',
            endTime: exam.endTime,
          },
          { status: 400 }
        );
      }
    } else {
      // Original time-based logic
      if (now < startTime) {
        return NextResponse.json(
          {
            error: 'Exam has not started yet',
            startTime: exam.startTime,
          },
          { status: 400 }
        );
      }

      if (now > endTime) {
        return NextResponse.json(
          {
            error: 'Exam has ended',
            endTime: exam.endTime,
          },
          { status: 400 }
        );
      }
    }

    // Check existing attempts
    const existingAttempts = await prisma.examAttempt.findMany({
      where: {
        examId,
        studentId: student.id,
      },
      orderBy: { attemptNumber: 'desc' },
    });

    // Check if student has an active attempt
    const activeAttempt = existingAttempts.find(
      attempt => attempt.status === 'IN_PROGRESS'
    );
    if (activeAttempt) {
      // Resume existing attempt
      const questions = exam.shuffle
        ? [...exam.questions].sort(() => Math.random() - 0.5)
        : exam.questions;

      return NextResponse.json({
        message: 'Resuming existing attempt',
        attempt: activeAttempt,
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.questions.reduce((sum, q) => sum + q.points, 0),
          shuffle: exam.shuffle,
          negativeMarking: exam.negativeMarking,
          showResultsImmediately: exam.showResultsImmediately,
          endTime: exam.endTime,
        },
        questions: questions.map(q => ({
          ...q,
          correctAnswer: undefined, // Don't send correct answers to client
          explanation: undefined,
        })),
        timeRemaining: Math.max(0, endTime.getTime() - now.getTime()),
      });
    }

    // Check attempt limits
    if (existingAttempts.length >= exam.maxAttempts) {
      return NextResponse.json(
        {
          error: `Maximum attempts (${exam.maxAttempts}) reached for this exam`,
        },
        { status: 400 }
      );
    }

    // Get client info for tracking
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Create new attempt with proper attempt number calculation
    const nextAttemptNumber = existingAttempts.length + 1;

    // Use upsert to handle potential race conditions
    const newAttempt = await prisma.examAttempt.upsert({
      where: {
        studentId_examId_attemptNumber: {
          studentId: student.id,
          examId,
          attemptNumber: nextAttemptNumber,
        },
      },
      update: {
        startedAt: now,
        status: 'IN_PROGRESS',
        ipAddress,
        userAgent,
      },
      create: {
        examId,
        studentId: student.id,
        attemptNumber: nextAttemptNumber,
        startedAt: now,
        status: 'IN_PROGRESS',
        ipAddress,
        userAgent,
      },
    });

    // Shuffle questions if required
    const questions = exam.shuffle
      ? [...exam.questions].sort(() => Math.random() - 0.5)
      : exam.questions;

    return NextResponse.json({
      message: 'Exam started successfully',
      attempt: newAttempt,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.questions.reduce((sum, q) => sum + q.points, 0),
        shuffle: exam.shuffle,
        negativeMarking: exam.negativeMarking,
        showResultsImmediately: exam.showResultsImmediately,
        endTime: exam.endTime,
      },
      questions: questions.map(q => ({
        ...q,
        correctAnswer: undefined, // Don't send correct answers to client
        explanation: undefined,
      })),
      timeRemaining: Math.max(0, endTime.getTime() - now.getTime()),
    });
  } catch (error) {
    console.error('Error starting exam:', error);
    return NextResponse.json(
      { error: 'Failed to start exam' },
      { status: 500 }
    );
  }
}
