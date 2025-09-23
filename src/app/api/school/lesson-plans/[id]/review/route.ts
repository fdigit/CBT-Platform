import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonPlanId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get school admin profile
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id },
      include: { school: true },
    });

    if (!schoolAdmin) {
      return NextResponse.json(
        { error: 'School admin profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { reviewStatus, reviewNotes } = body;

    // Validate review status
    const validStatuses = ['APPROVED', 'REJECTED', 'NEEDS_REVISION'];
    if (!validStatuses.includes(reviewStatus)) {
      return NextResponse.json(
        { error: 'Invalid review status' },
        { status: 400 }
      );
    }

    // Require review notes for rejection or revision requests
    if (
      (reviewStatus === 'REJECTED' || reviewStatus === 'NEEDS_REVISION') &&
      !reviewNotes?.trim()
    ) {
      return NextResponse.json(
        {
          error: 'Review notes are required for rejection or revision requests',
        },
        { status: 400 }
      );
    }

    // Verify lesson plan belongs to this school and is pending review
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        id: lessonPlanId,
        schoolId: schoolAdmin.schoolId,
        status: 'PUBLISHED',
      },
      include: {
        teacher: {
          select: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!lessonPlan) {
      return NextResponse.json(
        { error: 'Lesson plan not found' },
        { status: 404 }
      );
    }

    // Update lesson plan with review
    const updatedLessonPlan = await prisma.lessonPlan.update({
      where: { id: lessonPlanId },
      data: {
        reviewStatus,
        reviewNotes: reviewNotes?.trim() || null,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
        subject: {
          select: { name: true },
        },
        class: {
          select: { name: true, section: true },
        },
      },
    });

    // TODO: Send notification to teacher about review outcome
    // This would typically involve creating a notification record and/or sending an email

    const reviewMessages: Record<string, string> = {
      APPROVED: 'Your lesson plan has been approved!',
      REJECTED:
        'Your lesson plan has been rejected. Please review the feedback and create a new version.',
      NEEDS_REVISION:
        'Your lesson plan needs revision. Please review the feedback and resubmit.',
    };
    const reviewMessage = reviewMessages[reviewStatus];

    return NextResponse.json({
      lessonPlan: updatedLessonPlan,
      message: `Lesson plan reviewed successfully. ${reviewMessage}`,
    });
  } catch (error) {
    console.error('Error reviewing lesson plan:', error);
    return NextResponse.json(
      { error: 'Failed to review lesson plan' },
      { status: 500 }
    );
  }
}
