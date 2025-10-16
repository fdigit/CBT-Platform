import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: announcementId, commentId } = await params;
    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // Check if comment exists and belongs to user
    const existingComment = await prisma.announcementComment.findFirst({
      where: {
        id: commentId,
        announcementId,
        authorId: session.user.id,
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found or access denied' },
        { status: 404 }
      );
    }

    // Update comment
    const updatedComment = await prisma.announcementComment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        isEdited: true,
        editedAt: new Date(),
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
            replies: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comment: updatedComment,
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    
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
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: announcementId, commentId } = await params;

    // Check if comment exists and belongs to user
    const existingComment = await prisma.announcementComment.findFirst({
      where: {
        id: commentId,
        announcementId,
        authorId: session.user.id,
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found or access denied' },
        { status: 404 }
      );
    }

    // Delete comment (cascade will handle replies)
    await prisma.announcementComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



