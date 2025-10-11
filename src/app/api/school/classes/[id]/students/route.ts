import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: classId } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (session.user.role === 'TEACHER') {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
      });

      if (!teacherProfile) {
        return NextResponse.json(
          { error: 'Teacher profile not found' },
          { status: 404 }
        );
      }

      const teacherClass = await prisma.teacherClass.findFirst({
        where: {
          teacherId: teacherProfile.id,
          classId: classId,
        },
      });

      if (!teacherClass && teacherProfile.schoolId !== classData.schoolId) {
        return NextResponse.json(
          { error: 'Access denied to this class' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'SCHOOL_ADMIN') {
      if (classData.schoolId !== session.user.schoolId) {
        return NextResponse.json(
          { error: 'Access denied to this class' },
          { status: 403 }
        );
      }
    }

    const students = await prisma.student.findMany({
      where: {
        classId: classId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    const formattedStudents = students.map(student => ({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      regNumber: student.regNumber,
      classId: student.classId,
      gender: student.gender,
      status: student.status,
    }));

    return NextResponse.json({
      success: true,
      students: formattedStudents,
      total: formattedStudents.length,
    });
  } catch (error) {
    console.error('Error fetching class students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
