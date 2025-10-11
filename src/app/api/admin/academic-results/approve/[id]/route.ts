import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: resultId } = await params;

    if (
      !session ||
      !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hodComment, principalComment } = body;

    const result = await prisma.academicResult.findUnique({
      where: { id: resultId },
      include: {
        school: true,
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        subject: { select: { name: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    if (
      session.user.role === 'SCHOOL_ADMIN' &&
      result.schoolId !== session.user.schoolId
    ) {
      return NextResponse.json(
        { error: 'You can only approve results from your school' },
        { status: 403 }
      );
    }

    if (result.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: `Cannot approve result with status: ${result.status}` },
        { status: 400 }
      );
    }

    const updatedResult = await prisma.academicResult.update({
      where: { id: resultId },
      data: {
        status: 'APPROVED',
        approvedByAdmin: true,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        hodComment: hodComment || result.hodComment,
        principalComment: principalComment || result.principalComment,
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        subject: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Result approved successfully',
      result: updatedResult,
    });
  } catch (error) {
    console.error('Error approving result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
