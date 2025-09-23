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
    const { id } = await params;

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { school: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Check if exam exists and belongs to teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id,
        teacherId: teacher.id,
      },
      include: {
        questions: true,
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found or access denied' },
        { status: 404 }
      );
    }

    // Validate exam can be submitted for approval
    if (exam.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft exams can be submitted for approval' },
        { status: 400 }
      );
    }

    // Validate exam has required data
    if (!exam.questions.length) {
      return NextResponse.json(
        { error: 'Exam must have at least one question' },
        { status: 400 }
      );
    }

    if (!exam.startTime || !exam.endTime) {
      return NextResponse.json(
        { error: 'Exam must have start and end times' },
        { status: 400 }
      );
    }

    if (exam.startTime >= exam.endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Update exam status to pending approval
    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
      },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true, section: true } },
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    // Create notification for school admin
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
            message: `${updatedExam.teacher?.user.name} has submitted exam "${updatedExam.title}" for approval.`,
            type: 'EXAM_SUBMITTED_FOR_APPROVAL',
            userId: admin.userId,
            metadata: {
              examId: id,
              schoolId: teacher.schoolId,
              teacherId: teacher.id,
              teacherName: updatedExam.teacher?.user.name,
              examTitle: updatedExam.title,
              subjectName: updatedExam.subject?.name,
              className: updatedExam.class
                ? `${updatedExam.class.name} ${updatedExam.class.section || ''}`
                : 'All Classes',
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Exam submitted for approval successfully',
      exam: updatedExam,
    });
  } catch (error) {
    console.error('Error submitting exam for approval:', error);
    return NextResponse.json(
      { error: 'Failed to submit exam for approval' },
      { status: 500 }
    );
  }
}
