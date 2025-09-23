import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id: assignmentId, submissionId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { score, feedback } = body;

    // Validate score
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: 'Invalid score provided' },
        { status: 400 }
      );
    }

    // Verify assignment belongs to teacher and get max score
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        teacherId: teacher.id,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (score > assignment.maxScore) {
      return NextResponse.json(
        {
          error: `Score cannot exceed maximum score of ${assignment.maxScore}`,
        },
        { status: 400 }
      );
    }

    // Update submission with grade
    const submission = await prisma.assignmentSubmission.update({
      where: {
        id: submissionId,
        assignmentId,
      },
      data: {
        score,
        feedback,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedBy: teacher.id,
      },
      include: {
        student: {
          select: {
            id: true,
            regNumber: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
        attachments: true,
      },
    });

    // TODO: Send notification to student about graded assignment

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    );
  }
}
