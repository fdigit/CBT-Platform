import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: { class: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { textContent, attachments = [] } = body;

    // Get assignment and verify it's available to this student
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        status: 'PUBLISHED',
        OR: [{ classId: student.classId }, { classId: null }],
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or not available' },
        { status: 404 }
      );
    }

    // Check if assignment is past due date
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      // Allow late submission but mark it as late
    }

    // Check if student has already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Assignment already submitted' },
        { status: 400 }
      );
    }

    // Determine submission status
    let submissionStatus: 'SUBMITTED' | 'LATE' = 'SUBMITTED';
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      submissionStatus = 'LATE';
    }

    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: student.id,
        textContent,
        status: submissionStatus,
        attachments: {
          create: attachments.map((attachment: any) => ({
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            filePath: attachment.filePath,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
          })),
        },
      },
      include: {
        attachments: true,
        assignment: {
          select: {
            title: true,
            teacher: {
              select: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    // TODO: Send notification to teacher about new submission

    return NextResponse.json(
      {
        submission: {
          id: submission.id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          textContent: submission.textContent,
          attachments: submission.attachments.map(att => ({
            id: att.id,
            name: att.originalName,
            url: `/api/attachments/${att.fileName}`,
          })),
        },
        message:
          submissionStatus === 'LATE'
            ? 'Assignment submitted late'
            : 'Assignment submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const session = await getServerSession(authOptions);

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

    const body = await request.json();
    const { textContent, attachments = [] } = body;

    // Get existing submission
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      include: {
        assignment: true,
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if submission can be modified (not yet graded)
    if (existingSubmission.status === 'GRADED') {
      return NextResponse.json(
        { error: 'Cannot modify graded submission' },
        { status: 400 }
      );
    }

    // Check if assignment is still open for modifications
    if (
      existingSubmission.assignment.dueDate &&
      new Date() > existingSubmission.assignment.dueDate
    ) {
      return NextResponse.json(
        { error: 'Assignment deadline has passed' },
        { status: 400 }
      );
    }

    // Update submission
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: {
        id: existingSubmission.id,
      },
      data: {
        textContent,
        updatedAt: new Date(),
        // Note: For simplicity, we're not handling attachment updates here
        // In a real implementation, you'd need to handle adding/removing attachments
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json({
      submission: {
        id: updatedSubmission.id,
        status: updatedSubmission.status,
        submittedAt: updatedSubmission.submittedAt,
        updatedAt: updatedSubmission.updatedAt,
        textContent: updatedSubmission.textContent,
        attachments: updatedSubmission.attachments.map(att => ({
          id: att.id,
          name: att.originalName,
          url: `/api/attachments/${att.fileName}`,
        })),
      },
      message: 'Submission updated successfully',
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
