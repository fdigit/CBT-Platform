import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const studentId = session.user.studentProfile?.id;
    if (!studentId) {
      return NextResponse.json(
        { message: 'Student profile not found' },
        { status: 404 }
      );
    }

    const results = await prisma.result.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            title: true,
            duration: true,
          },
        },
      },
      orderBy: {
        gradedAt: 'desc',
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching student results:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
