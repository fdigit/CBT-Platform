import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long').optional(),
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

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const announcement = await prisma.announcement.findFirst({
      where: {
        id,
        authorId: session.user.id,
        schoolId: teacher.schoolId,
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

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateAnnouncementSchema.parse(body);

    // Check if announcement exists and belongs to the teacher
    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id,
        authorId: session.user.id,
        schoolId: teacher.schoolId,
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
      const teacherClasses = await prisma.classSubject.findMany({
        where: {
          teacherId: teacher.id,
          classId: { in: validatedData.classIds },
        },
        select: { classId: true },
      });

      const teacherClassIds = teacherClasses.map(tc => tc.classId);
      const invalidClassIds = validatedData.classIds.filter(
        id => !teacherClassIds.includes(id)
      );

      if (invalidClassIds.length > 0) {
        return NextResponse.json(
          { error: 'You are not authorized to target some of the specified classes' },
          { status: 403 }
        );
      }
    }

    if (validatedData.subjectIds && validatedData.subjectIds.length > 0) {
      const teacherSubjects = await prisma.classSubject.findMany({
        where: {
          teacherId: teacher.id,
          subjectId: { in: validatedData.subjectIds },
        },
        select: { subjectId: true },
      });

      const teacherSubjectIds = teacherSubjects.map(ts => ts.subjectId);
      const invalidSubjectIds = validatedData.subjectIds.filter(
        id => !teacherSubjectIds.includes(id)
      );

      if (invalidSubjectIds.length > 0) {
        return NextResponse.json(
          { error: 'You are not authorized to target some of the specified subjects' },
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

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Check if announcement exists and belongs to the teacher
    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id,
        authorId: session.user.id,
        schoolId: teacher.schoolId,
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



