import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { examIds, action, reason } = body;

    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
      return NextResponse.json(
        { message: 'Invalid exam IDs' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Get exams to verify they exist and get school info
    const exams = await prisma.exam.findMany({
      where: {
        id: {
          in: examIds,
        },
      },
      include: {
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

    if (exams.length !== examIds.length) {
      return NextResponse.json(
        { message: 'Some exams not found' },
        { status: 404 }
      );
    }

    let results: any[] = [];

    if (action === 'approve') {
      // Create notifications for all approved exams
      const notifications = exams.map(exam => ({
        title: 'Exam Approved',
        message: `Your exam "${exam.title}" has been approved by the administrator.`,
        type: 'SYSTEM_ALERT' as const,
        userId: session.user.id,
        metadata: {
          examId: exam.id,
          schoolId: exam.schoolId,
          action: 'APPROVED',
        },
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      results = exams.map(exam => ({
        examId: exam.id,
        title: exam.title,
        status: 'approved',
      }));
    } else if (action === 'reject') {
      // Create notifications for all rejected exams
      const notifications = exams.map(exam => ({
        title: 'Exam Rejected',
        message: `Your exam "${exam.title}" has been rejected. Reason: ${reason || 'No reason provided'}`,
        type: 'SYSTEM_ALERT' as const,
        userId: session.user.id,
        metadata: {
          examId: exam.id,
          schoolId: exam.schoolId,
          action: 'REJECTED',
          reason: reason || 'No reason provided',
        },
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      results = exams.map(exam => ({
        examId: exam.id,
        title: exam.title,
        status: 'rejected',
      }));
    } else if (action === 'delete') {
      // Check if any exam has results or answers
      const examsWithResponses = exams.filter(
        exam => exam._count.results > 0 || exam._count.answers > 0
      );

      if (examsWithResponses.length > 0) {
        return NextResponse.json(
          {
            message:
              'Some exams cannot be deleted as they have student responses',
            examsWithResponses: examsWithResponses.map(exam => ({
              id: exam.id,
              title: exam.title,
              responsesCount: exam._count.results + exam._count.answers,
            })),
          },
          { status: 400 }
        );
      }

      // Delete exams and related questions in a transaction
      await prisma.$transaction(async tx => {
        // Delete questions first
        await tx.question.deleteMany({
          where: {
            examId: {
              in: examIds,
            },
          },
        });

        // Delete exams
        await tx.exam.deleteMany({
          where: {
            id: {
              in: examIds,
            },
          },
        });

        // Create notifications
        const notifications = exams.map(exam => ({
          title: 'Exam Deleted',
          message: `Your exam "${exam.title}" has been deleted by the administrator.`,
          type: 'SYSTEM_ALERT' as const,
          userId: session.user.id,
          metadata: {
            examId: exam.id,
            schoolId: exam.schoolId,
            action: 'DELETED',
          },
        }));

        await tx.notification.createMany({
          data: notifications,
        });
      });

      results = exams.map(exam => ({
        examId: exam.id,
        title: exam.title,
        status: 'deleted',
      }));
    }

    return NextResponse.json({
      message: `Bulk ${action} completed successfully`,
      results,
      processedCount: results.length,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { message: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
