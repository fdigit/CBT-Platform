import { authOptions } from '@/lib/auth';
import { getDynamicStatus } from '@/lib/exam-status';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const subject = searchParams.get('subject') || '';

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true } },
        school: { select: { id: true, name: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      teacherId: teacher.id,
      schoolId: teacher.schoolId,
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (subject) {
      where.subjectId = subject;
    }

    // Get exams with pagination
    const [exams, totalCount] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          subject: {
            select: {
              name: true,
              code: true,
            },
          },
          class: {
            select: {
              name: true,
              section: true,
            },
          },
          questions: {
            select: {
              id: true,
              type: true,
              points: true,
              difficulty: true,
            },
          },
          attempts: {
            select: {
              id: true,
              status: true,
              startedAt: true,
              submittedAt: true,
            },
          },
          results: {
            select: {
              id: true,
              score: true,
              gradedAt: true,
            },
          },
          _count: {
            select: {
              results: true,
              attempts: true,
              answers: true,
            },
          },
          approver: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.exam.count({ where }),
    ]);

    // Add computed fields using unified logic
    const now = new Date();
    const examsWithStats = exams.map(exam => {
      // Use unified status calculation
      const dynamicStatus = getDynamicStatus(
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

      return {
        ...exam,
        totalQuestions: exam.questions.length,
        totalMarks: exam.questions.reduce((sum, q) => sum + q.points, 0),
        studentsAttempted: exam._count.attempts || 0,
        studentsCompleted: exam._count.results || 0,
        subjectName: exam.subject?.name || 'General',
        className: exam.class
          ? `${exam.class.name} ${exam.class.section || ''}`
          : 'All Classes',
        approverName: exam.approver?.name || null,
        dynamicStatus,
      };
    });

    return NextResponse.json({
      exams: examsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher exams:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true } },
        school: { select: { id: true, name: true } },
        subjects: { include: { subject: true } },
        classSubjects: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      subjectId,
      classId,
      startTime,
      endTime,
      duration,
      totalMarks,
      passingMarks,
      shuffle,
      negativeMarking,
      allowPreview,
      showResultsImmediately,
      maxAttempts,
      questions,
      status,
      manualControl,
      isLive,
      isCompleted,
    }: {
      title: string;
      description: string;
      subjectId: string;
      classId: string;
      startTime: string;
      endTime: string;
      duration: number;
      totalMarks: number;
      passingMarks: number;
      shuffle: boolean;
      negativeMarking: boolean;
      allowPreview: boolean;
      showResultsImmediately: boolean;
      maxAttempts: number;
      questions: Array<{
        type: string;
        question?: string;
        text?: string;
        options?: string[];
        correctAnswer?: string;
        points?: number;
        explanation?: string;
        difficulty?: string;
        imageUrl?: string;
        audioUrl?: string;
        videoUrl?: string;
        tags?: string[];
      }>;
      status?: string;
      manualControl?: boolean;
      isLive?: boolean;
      isCompleted?: boolean;
    } = body;

    // Validation
    if (
      !title ||
      !startTime ||
      !endTime ||
      !duration ||
      !questions ||
      questions.length === 0
    ) {
      return NextResponse.json(
        {
          message:
            'Missing required fields: title, startTime, endTime, duration, questions',
        },
        { status: 400 }
      );
    }

    // Validate question types
    const validQuestionTypes = [
      'MCQ',
      'TRUE_FALSE',
      'ESSAY',
      'SHORT_ANSWER',
      'FILL_IN_BLANK',
    ];
    const invalidQuestions = questions.filter(
      (q: any) => !validQuestionTypes.includes(q.type)
    );

    if (invalidQuestions.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid question types found: ${invalidQuestions.map((q: any) => q.type).join(', ')}. Valid types are: ${validQuestionTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate teacher access to class and subject (allow flexibility for 'all' and 'general')
    if (classId !== 'all' && subjectId !== 'general') {
      const hasAccess = teacher.classSubjects.some(
        cs => cs.subjectId === subjectId && cs.classId === classId
      );

      if (!hasAccess) {
        // Fallback: check if teacher has access to the class through any subject
        const hasClassAccess = teacher.classSubjects.some(
          cs => cs.classId === classId
        );

        if (!hasClassAccess) {
          return NextResponse.json(
            {
              message:
                'You do not have access to this class/subject combination',
            },
            { status: 403 }
          );
        }
      }
    }

    // Calculate total marks from questions if not provided
    const calculatedTotalMarks =
      totalMarks ||
      questions.reduce(
        (sum: number, q: { points?: number }) => sum + (q.points || 1),
        0
      );

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        subjectId: subjectId === 'general' ? null : subjectId,
        classId: classId === 'all' ? null : classId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        totalMarks: calculatedTotalMarks,
        passingMarks: passingMarks || Math.ceil(calculatedTotalMarks * 0.4),
        shuffle: shuffle || false,
        negativeMarking: negativeMarking || false,
        allowPreview: allowPreview || false,
        showResultsImmediately: showResultsImmediately || false,
        maxAttempts: maxAttempts || 1,
        status: (status || 'DRAFT') as any,
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
        // Manual control settings
        manualControl: manualControl || false,
        isLive: isLive || false,
        isCompleted: isCompleted || false,
        questions: {
          create: (questions as any).map(
            (
              q: {
                type: string;
                question?: string;
                text?: string;
                options?: string[];
                correctAnswer?: string;
                points?: number;
                explanation?: string;
                difficulty?: string;
                imageUrl?: string;
                audioUrl?: string;
                videoUrl?: string;
                tags?: string[];
              },
              index: number
            ) => ({
              type: q.type,
              text: q.question || q.text, // Support both field names
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              points: q.points || 1,
              explanation: q.explanation,
              difficulty: q.difficulty || 'MEDIUM',
              order: index + 1,
              imageUrl: q.imageUrl,
              audioUrl: q.audioUrl,
              videoUrl: q.videoUrl,
              tags: q.tags || [],
            })
          ),
        },
      },
      include: {
        questions: true,
        subject: { select: { name: true } },
        class: { select: { name: true, section: true } },
      },
    });

    // If exam is submitted for approval, create notifications for school admins
    if (status === 'PENDING_APPROVAL') {
      const schoolAdmins = await prisma.schoolAdmin.findMany({
        where: { schoolId: teacher.schoolId },
        include: { user: true },
      });

      // Create notifications for all school admins
      await Promise.all(
        schoolAdmins.map(admin =>
          prisma.notification.create({
            data: {
              title: 'Exam Approval Required',
              message: `${teacher.user.name} has submitted exam "${exam.title}" for approval.`,
              type: 'EXAM_SUBMITTED_FOR_APPROVAL',
              userId: admin.userId,
              metadata: {
                examId: exam.id,
                schoolId: teacher.schoolId,
                teacherId: teacher.id,
                teacherName: teacher.user.name,
                examTitle: exam.title,
                subjectName: exam.subject?.name,
                className: exam.class
                  ? `${exam.class.name} ${exam.class.section || ''}`
                  : 'All Classes',
              },
            },
          })
        )
      );
    }

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
