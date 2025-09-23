import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const examId = id;

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: {
            results: true,
            answers: true,
          },
        },
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
    }

    // Check if exam has results or answers (prevent deletion if students have taken it)
    if (exam._count.results > 0 || exam._count.answers > 0) {
      return NextResponse.json(
        { message: 'Cannot delete exam with existing student responses' },
        { status: 400 }
      );
    }

    // Delete exam and related questions in a transaction
    await prisma.$transaction(async tx => {
      // Delete questions first (due to foreign key constraint)
      await tx.question.deleteMany({
        where: { examId: examId },
      });

      // Delete exam
      await tx.exam.delete({
        where: { id: examId },
      });

      // Create notification to the school about deletion
      await tx.notification.create({
        data: {
          title: 'Exam Deleted',
          message: `Your exam "${exam.title}" has been deleted by the administrator.`,
          type: 'SYSTEM_ALERT',
          userId: session.user.id,
          metadata: {
            examId: examId,
            schoolId: exam.schoolId,
            action: 'DELETED',
          },
        },
      });
    });

    return NextResponse.json({
      message: 'Exam deleted successfully',
      examId: examId,
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { message: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}
