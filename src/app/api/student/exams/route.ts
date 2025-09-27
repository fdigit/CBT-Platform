import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateExamStatus } from '@/lib/exam-status';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        school: true,
        class: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'available';
    const search = searchParams.get('search');

    const now = new Date();

    // Build where clause - only show published exams
    const where: any = {
      schoolId: student.schoolId,
      status: {
        in: ['PUBLISHED', 'APPROVED'],
      },
      OR: [
        { classId: student.classId }, // Exams for student's class
        { classId: null }, // General exams for all classes
      ],
    };

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Filter by status - consider manual control
    if (status === 'upcoming') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            // Time-based upcoming
            { startTime: { gt: now } },
            // Manual control not live yet
            {
              AND: [
                { manualControl: true },
                { isLive: false },
                { isCompleted: false },
              ],
            },
          ],
        },
      ];
    } else if (status === 'active') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            // Time-based active
            {
              AND: [
                { startTime: { lte: now } },
                { endTime: { gte: now } },
                { manualControl: false },
              ],
            },
            // Manual control live
            {
              AND: [
                { manualControl: true },
                { isLive: true },
                { isCompleted: false },
              ],
            },
          ],
        },
      ];
    } else if (status === 'completed') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            // Time-based completed
            {
              AND: [{ endTime: { lt: now } }, { manualControl: false }],
            },
            // Manual control completed
            {
              AND: [{ manualControl: true }, { isCompleted: true }],
            },
          ],
        },
      ];
    }

    // Get exams with student's attempts and results
    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: {
          select: { name: true, code: true },
        },
        class: {
          select: { name: true, section: true },
        },
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
        questions: {
          select: {
            id: true,
            points: true,
            type: true,
          },
        },
        attempts: {
          where: { studentId: student.id },
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
        results: {
          where: { studentId: student.id },
        },
      },
      orderBy: [{ startTime: 'asc' }],
    });

    // Calculate exam statistics and student status using unified logic
    const examsWithStatus = exams.map(exam => {
      const totalMarks = exam.questions.reduce((sum, q) => sum + q.points, 0);

      // Use unified status calculation
      const statusInfo = calculateExamStatus(
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

      // Get score from latest result
      const result = exam.results[0];
      const score = result ? result.score : null;
      const attemptCount = exam.attempts.length;

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        totalMarks,
        passingMarks: exam.passingMarks,
        maxAttempts: exam.maxAttempts,
        allowPreview: exam.allowPreview,
        showResultsImmediately: exam.showResultsImmediately,
        examStatus: statusInfo.examStatus,
        studentStatus: statusInfo.studentStatus,
        canTake: statusInfo.canTake,
        canResume: statusInfo.canResume,
        timeRemaining: statusInfo.timeRemaining,
        isExpired: statusInfo.isExpired,
        score,
        attemptCount,
        totalQuestions: exam.questions.length,
        subject: exam.subject,
        class: exam.class,
        teacherName: exam.teacher?.user?.name || 'Unknown',
        questionTypes: exam.questions.reduce(
          (acc, q) => {
            acc[q.type] = (acc[q.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    });

    return NextResponse.json({
      exams: examsWithStatus,
    });
  } catch (error) {
    console.error('Error fetching student exams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
