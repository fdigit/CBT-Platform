import { authOptions } from '@/lib/auth';
import { notifyAboutAnnouncementComment } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
  parentCommentId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: announcementId } = await params;
    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Check if announcement exists and user can access it
    let announcement;
    let schoolId;

    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        include: {
          class: {
            include: {
              subjects: {
                select: { subjectId: true },
              },
            },
          },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: 'Student profile not found' },
          { status: 404 }
        );
      }

      schoolId = student.schoolId;

      // Check if student can access this announcement
      announcement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          schoolId: student.schoolId,
          isPublished: true,
          OR: [
            // Announcements targeted to all students (no specific targeting)
            {
              targetAudience: 'STUDENTS',
              AND: [
                { classIds: { equals: null } },
                { subjectIds: { equals: null } },
              ],
            },
            // Announcements targeted to all users
            {
              targetAudience: 'ALL',
            },
            // Announcements with any targeting (we'll filter in application layer)
            {
              targetAudience: { in: ['STUDENTS', 'ALL'] },
              OR: [
                { classIds: { not: null } },
                { subjectIds: { not: null } },
                { recipientIds: { not: null } },
              ],
            },
          ],
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Apply application-level filtering for targeted announcements
      if (announcement && announcement.targetAudience !== 'ALL') {
        const announcementAny = announcement as any;
        
        // Check if student is in targeted classes
        if (announcementAny.classIds && Array.isArray(announcementAny.classIds)) {
          if (!announcementAny.classIds.includes(student.classId)) {
            announcement = null;
          }
        }

        // Check if student's subjects are in targeted subjects
        if (announcement && announcementAny.subjectIds && Array.isArray(announcementAny.subjectIds) &&
            student.class?.subjects && student.class.subjects.length > 0) {
          const studentSubjectIds = student.class.subjects.map(cs => cs.subjectId);
          const hasMatchingSubject = announcementAny.subjectIds.some((subjectId: any) =>
            studentSubjectIds.includes(subjectId)
          );
          if (!hasMatchingSubject) {
            announcement = null;
          }
        }

        // Check if student is in recipientIds
        if (announcement && announcementAny.recipientIds && Array.isArray(announcementAny.recipientIds)) {
          if (!announcementAny.recipientIds.includes(student.userId)) {
            announcement = null;
          }
        }
      }
    } else if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: 'Teacher profile not found' },
          { status: 404 }
        );
      }

      schoolId = teacher.schoolId;

      announcement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          schoolId: teacher.schoolId,
        },
      });
    } else if (session.user.role === 'SCHOOL_ADMIN') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'School ID not found in session' },
          { status: 400 }
        );
      }

      schoolId = session.user.schoolId;

      announcement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          schoolId: session.user.schoolId,
        },
      });
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Validate parent comment if provided
    if (validatedData.parentCommentId) {
      const parentComment = await prisma.announcementComment.findFirst({
        where: {
          id: validatedData.parentCommentId,
          announcementId,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // Create comment
    const comment = await prisma.announcementComment.create({
      data: {
        content: validatedData.content,
        announcementId,
        authorId: session.user.id,
        parentCommentId: validatedData.parentCommentId || undefined,
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
            replies: true,
          },
        },
      },
    });

    // Get users to notify about the comment
    let targetUserIds: string[] = [];

    // Notify announcement author
    if (announcement.authorId !== session.user.id) {
      targetUserIds.push(announcement.authorId);
    }

    // Notify parent comment author if this is a reply
    if (validatedData.parentCommentId) {
      const parentComment = await prisma.announcementComment.findUnique({
        where: { id: validatedData.parentCommentId },
        select: { authorId: true },
      });

      if (parentComment && parentComment.authorId !== session.user.id) {
        targetUserIds.push(parentComment.authorId);
      }
    }

    // Send notifications
    if (targetUserIds.length > 0) {
      await notifyAboutAnnouncementComment(
        announcementId,
        session.user.name || 'User',
        validatedData.content,
        targetUserIds
      );
    }

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: announcementId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Check if user can access this announcement (same logic as POST)
    let announcement;
    let schoolId;

    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        include: {
          class: {
            include: {
              subjects: {
                select: { subjectId: true },
              },
            },
          },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: 'Student profile not found' },
          { status: 404 }
        );
      }

      schoolId = student.schoolId;

      announcement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          schoolId: student.schoolId,
          isPublished: true,
          OR: [
            // Announcements targeted to all students (no specific targeting)
            {
              targetAudience: 'STUDENTS',
              AND: [
                { classIds: { equals: null } },
                { subjectIds: { equals: null } },
              ],
            },
            // Announcements targeted to all users
            {
              targetAudience: 'ALL',
            },
            // Announcements with any targeting (we'll filter in application layer)
            {
              targetAudience: { in: ['STUDENTS', 'ALL'] },
              OR: [
                { classIds: { not: null } },
                { subjectIds: { not: null } },
                { recipientIds: { not: null } },
              ],
            },
          ],
        },
      });

      // Apply application-level filtering for targeted announcements
      if (announcement && announcement.targetAudience !== 'ALL') {
        const announcementAny = announcement as any;
        
        // Check if student is in targeted classes
        if (announcementAny.classIds && Array.isArray(announcementAny.classIds)) {
          if (!announcementAny.classIds.includes(student.classId)) {
            announcement = null;
          }
        }

        // Check if student's subjects are in targeted subjects
        if (announcement && announcementAny.subjectIds && Array.isArray(announcementAny.subjectIds) &&
            student.class?.subjects && student.class.subjects.length > 0) {
          const studentSubjectIds = student.class.subjects.map(cs => cs.subjectId);
          const hasMatchingSubject = announcementAny.subjectIds.some((subjectId: any) =>
            studentSubjectIds.includes(subjectId)
          );
          if (!hasMatchingSubject) {
            announcement = null;
          }
        }

        // Check if student is in recipientIds
        if (announcement && announcementAny.recipientIds && Array.isArray(announcementAny.recipientIds)) {
          if (!announcementAny.recipientIds.includes(student.userId)) {
            announcement = null;
          }
        }
      }
    } else if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: 'Teacher profile not found' },
          { status: 404 }
        );
      }

      schoolId = teacher.schoolId;

      announcement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          schoolId: teacher.schoolId,
        },
      });
    } else if (session.user.role === 'SCHOOL_ADMIN') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'School ID not found in session' },
          { status: 400 }
        );
      }

      schoolId = session.user.schoolId;

      announcement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          schoolId: session.user.schoolId,
        },
      });
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Get comments (only top-level comments, replies will be included via relation)
    const comments = await prisma.announcementComment.findMany({
      where: {
        announcementId,
        parentCommentId: null, // Only top-level comments
      },
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
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      skip: offset,
      take: limit,
    });

    const totalCount = await prisma.announcementComment.count({
      where: {
        announcementId,
        parentCommentId: null,
      },
    });

    return NextResponse.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



