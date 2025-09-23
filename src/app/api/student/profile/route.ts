import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true,
          },
        },
        school: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    const profile = {
      id: student.id,
      regNo: student.regNumber,
      name: student.user.name,
      email: student.user.email,
      school: student.school,
      createdAt: student.user.createdAt.toISOString(),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json();
    const { name, email } = body;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        user: {
          update: {
            name,
            ...(email && { email }),
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true,
          },
        },
        school: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    const profile = {
      id: updatedStudent.id,
      regNo: updatedStudent.regNumber,
      name: updatedStudent.user.name,
      email: updatedStudent.user.email,
      school: updatedStudent.school,
      createdAt: updatedStudent.user.createdAt.toISOString(),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
