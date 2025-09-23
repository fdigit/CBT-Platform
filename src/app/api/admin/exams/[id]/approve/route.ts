import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let action = 'unknown'; // Default value for error handling

  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const requestData = body;
    action = requestData.action;
    const { rejectionReason, publishNow = false } = requestData;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting an exam' },
        { status: 400 }
      );
    }

    // Get school admin profile
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id },
    });

    if (!schoolAdmin) {
      return NextResponse.json(
        { error: 'School admin profile not found' },
        { status: 404 }
      );
    }

    // Check if exam exists and belongs to the same school
    const exam = await prisma.exam.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId,
        status: 'PENDING_APPROVAL',
      },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        subject: { select: { name: true } },
        class: { select: { name: true, section: true } },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found or not pending approval' },
        { status: 404 }
      );
    }

    // Check for exam time conflicts if approving
    if (action === 'approve') {
      const conflictingExams = await prisma.exam.findMany({
        where: {
          schoolId: schoolAdmin.schoolId,
          classId: exam.classId,
          status: {
            in: ['APPROVED', 'PUBLISHED', 'SCHEDULED'],
          },
          OR: [
            {
              AND: [
                { startTime: { lte: exam.startTime } },
                { endTime: { gte: exam.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lte: exam.endTime } },
                { endTime: { gte: exam.endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: exam.startTime } },
                { endTime: { lte: exam.endTime } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
        },
      });

      if (conflictingExams.length > 0) {
        return NextResponse.json(
          {
            error: 'Exam time conflicts with existing exams',
            conflicts: conflictingExams,
          },
          { status: 409 }
        );
      }
    }

    // Update exam status
    const updateData: any = {
      approvedBy: session.user.id,
      approvedAt: new Date(),
    };

    if (action === 'approve') {
      updateData.status = publishNow ? 'PUBLISHED' : 'APPROVED';
      if (publishNow) {
        updateData.publishedAt = new Date();
      }
    } else {
      updateData.status = 'REJECTED';
      updateData.rejectionReason = rejectionReason;
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
        subject: { select: { name: true } },
        class: { select: { name: true, section: true } },
      },
    });

    // Create notification for teacher
    const notificationTitle =
      action === 'approve'
        ? `Exam ${publishNow ? 'Approved and Published' : 'Approved'}`
        : 'Exam Rejected';

    const notificationMessage =
      action === 'approve'
        ? `Your exam "${exam.title}" has been ${publishNow ? 'approved and published' : 'approved'} by the school admin.`
        : `Your exam "${exam.title}" has been rejected. Reason: ${rejectionReason}`;

    await prisma.notification.create({
      data: {
        title: notificationTitle,
        message: notificationMessage,
        type: action === 'approve' ? 'EXAM_APPROVED' : 'EXAM_REJECTED',
        userId: exam.teacher?.user.id!,
        metadata: {
          examId: id,
          schoolId: schoolAdmin.schoolId,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          publishedNow: publishNow,
        },
      },
    });

    return NextResponse.json({
      message: `Exam ${action}d successfully`,
      exam: updatedExam,
    });
  } catch (error) {
    console.error(`Error ${action}ing exam:`, error);
    return NextResponse.json(
      { error: `Failed to ${action} exam` },
      { status: 500 }
    );
  }
}
