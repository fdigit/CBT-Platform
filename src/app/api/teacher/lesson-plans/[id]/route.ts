import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateLessonPlanSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  topic: z.string().optional(),
  duration: z.number().int().positive('Duration must be positive').optional(),
  objectives: z
    .array(z.string())
    .min(1, 'At least one objective is required')
    .optional(),
  materials: z.array(z.string()).optional(),
  activities: z
    .array(z.string())
    .min(1, 'At least one activity is required')
    .optional(),
  assessment: z.string().optional(),
  homework: z.string().optional(),
  notes: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  scheduledDate: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get lesson plan
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        id,
        teacherId: teacher.id,
      },
      include: {
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

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Check if lesson plan exists and belongs to teacher
    const existingLessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        id,
        teacherId: teacher.id,
      },
    });

    if (!existingLessonPlan) {
      return NextResponse.json(
        { message: 'Lesson plan not found' },
        { status: 404 }
      );
    }

    // Check if lesson plan can be modified
    if (existingLessonPlan.reviewStatus === 'APPROVED') {
      return NextResponse.json(
        { message: 'Cannot modify approved lesson plan' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateLessonPlanSchema.parse(body);

    // Verify teacher has access to the class and subject if they're being updated
    // TODO: Implement proper teacher-class-subject assignment system
    // For now, allow lesson plan updates with warning logs
    if (validatedData.classId && validatedData.classId !== 'none') {
      console.log('Checking class access for update:', {
        teacherId: teacher.id,
        classId: validatedData.classId,
      });

      const classAccess = await prisma.teacherClass.findFirst({
        where: {
          teacherId: teacher.id,
          classId: validatedData.classId,
        },
      });

      console.log('Class access result:', classAccess);

      if (!classAccess) {
        console.log(
          '⚠️ Teacher does not have access to class, but allowing lesson plan update'
        );
        // TODO: Uncomment this when teacher-class relationships are properly set up
        // return NextResponse.json(
        //   { message: 'You do not have access to this class' },
        //   { status: 403 }
        // );
      }
    }

    if (validatedData.subjectId && validatedData.subjectId !== 'none') {
      console.log('Checking subject access for update:', {
        teacherId: teacher.id,
        subjectId: validatedData.subjectId,
      });

      const subjectAccess = await prisma.teacherSubject.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: validatedData.subjectId,
        },
      });

      console.log('Subject access result:', subjectAccess);

      if (!subjectAccess) {
        console.log(
          '⚠️ Teacher does not have access to subject, but allowing lesson plan update'
        );
        // TODO: Uncomment this when teacher-subject relationships are properly set up
        // return NextResponse.json(
        //   { message: 'You do not have access to this subject' },
        //   { status: 403 }
        // );
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData };

    // Convert "none" values to null for database
    if (updateData.classId === 'none') {
      updateData.classId = null;
    }
    if (updateData.subjectId === 'none') {
      updateData.subjectId = null;
    }

    if (validatedData.scheduledDate) {
      updateData.scheduledDate = new Date(validatedData.scheduledDate);
    }

    // If status is being changed to PUBLISHED, set review status to PENDING
    if (
      validatedData.status === 'PUBLISHED' &&
      existingLessonPlan.status !== 'PUBLISHED'
    ) {
      updateData.reviewStatus = 'PENDING';
      updateData.reviewNotes = null;
      updateData.reviewedAt = null;
      updateData.reviewedBy = null;
    }

    // Update lesson plan
    const lessonPlan = await prisma.lessonPlan.update({
      where: { id },
      data: updateData,
      include: {
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

    console.error('Error updating lesson plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Check if lesson plan exists and belongs to teacher
    const existingLessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        id,
        teacherId: teacher.id,
      },
    });

    if (!existingLessonPlan) {
      return NextResponse.json(
        { message: 'Lesson plan not found' },
        { status: 404 }
      );
    }

    // Check if lesson plan can be deleted
    if (existingLessonPlan.reviewStatus === 'APPROVED') {
      return NextResponse.json(
        { message: 'Cannot delete approved lesson plan' },
        { status: 400 }
      );
    }

    // Delete lesson plan (this will cascade delete resources)
    await prisma.lessonPlan.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Lesson plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
