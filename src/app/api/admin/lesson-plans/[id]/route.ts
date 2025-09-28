import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Role } from '@/lib/auth';

const reviewLessonPlanSchema = z.object({
  reviewStatus: z.enum(['APPROVED', 'REJECTED', 'NEEDS_REVISION']),
  reviewNotes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (
      !session ||
      ![Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause based on user role
    const where: any = { id };

    if (session.user.role === Role.SCHOOL_ADMIN) {
      where.schoolId = session.user.schoolId;
    }

    // Get lesson plan
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        resources: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            resourceType: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!lessonPlan) {
      return NextResponse.json(
        { message: 'Lesson plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lessonPlan);
  } catch (error) {
    console.error('Error fetching lesson plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (
      !session ||
      ![Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewLessonPlanSchema.parse(body);

    // Build where clause based on user role
    const where: any = { id };

    if (session.user.role === Role.SCHOOL_ADMIN) {
      where.schoolId = session.user.schoolId;
    }

    // Check if lesson plan exists
    const existingLessonPlan = await prisma.lessonPlan.findFirst({
      where,
    });

    if (!existingLessonPlan) {
      return NextResponse.json(
        { message: 'Lesson plan not found' },
        { status: 404 }
      );
    }

    // Update lesson plan with review
    const lessonPlan = await prisma.lessonPlan.update({
      where: { id },
      data: {
        reviewStatus: validatedData.reviewStatus,
        reviewNotes: validatedData.reviewNotes,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        resources: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            resourceType: true,
            uploadedAt: true,
          },
        },
      },
    });

    return NextResponse.json(lessonPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error reviewing lesson plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
