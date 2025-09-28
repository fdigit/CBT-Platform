import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createResourceSchema = z.object({
  fileName: z.string(),
  originalName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  resourceType: z.enum([
    'DOCUMENT',
    'VIDEO',
    'AUDIO',
    'IMAGE',
    'PRESENTATION',
    'SPREADSHEET',
  ]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonPlanId } = await params;
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

    // Verify the lesson plan belongs to this teacher
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        id: lessonPlanId,
        teacherId: teacher.id,
      },
    });

    if (!lessonPlan) {
      return NextResponse.json(
        { message: 'Lesson plan not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('Creating lesson plan resource with data:', body);

    const validatedData = createResourceSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Create the lesson plan resource
    const resource = await prisma.lessonPlanResource.create({
      data: {
        ...validatedData,
        lessonPlanId: lessonPlanId,
        // Remove uploadedBy field as it doesn't exist in the schema
      },
    });

    console.log('Created resource:', resource);
    return NextResponse.json(resource);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating lesson plan resource:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
