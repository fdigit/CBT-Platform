import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateAnnouncementSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content too long')
    .optional(),
  targetAudience: z.enum(['STUDENTS', 'TEACHERS', 'ALL']).optional(),
  classIds: z.array(z.string()).optional(),
  subjectIds: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: 'School ID not found in session' },
        { status: 400 }
      );
    }

    const { id } = await params;

    const announcement = await prisma.announcement.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: 'School ID not found in session' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateAnnouncementSchema.parse(body);

    // Check if announcement exists and belongs to the school
    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Validate class/subject access if being updated
    if (validatedData.classIds && validatedData.classIds.length > 0) {
      const schoolClasses = await prisma.class.findMany({
        where: {
          schoolId: session.user.schoolId,
          id: { in: validatedData.classIds },
        },
        select: { id: true },
      });

      const schoolClassIds = schoolClasses.map(c => c.id);
      const invalidClassIds = validatedData.classIds.filter(
        id => !schoolClassIds.includes(id)
      );

      if (invalidClassIds.length > 0) {
        return NextResponse.json(
          { error: 'Some specified classes do not belong to your school' },
          { status: 403 }
        );
      }
    }

    if (validatedData.subjectIds && validatedData.subjectIds.length > 0) {
      const schoolSubjects = await prisma.subject.findMany({
        where: {
          schoolId: session.user.schoolId,
          id: { in: validatedData.subjectIds },
        },
        select: { id: true },
      });

      const schoolSubjectIds = schoolSubjects.map(s => s.id);
      const invalidSubjectIds = validatedData.subjectIds.filter(
        id => !schoolSubjectIds.includes(id)
      );

      if (invalidSubjectIds.length > 0) {
        return NextResponse.json(
          { error: 'Some specified subjects do not belong to your school' },
          { status: 403 }
        );
      }
    }

    // Update announcement
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    console.error('Error updating announcement:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        { error: 'School ID not found in session' },
        { status: 400 }
      );
    }

    const { id } = await params;

    // Check if announcement exists and belongs to the school
    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Delete announcement (cascade will handle comments)
    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
