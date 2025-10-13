import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  classId: z.string().nullable().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z
    .string()
    .email('Valid parent email required')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  status: z
    .enum(['ACTIVE', 'SUSPENDED', 'GRADUATED', 'ALUMNI', 'PENDING'])
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            academicYear: true,
          },
        },
        results: {
          include: {
            exam: {
              select: {
                title: true,
                startTime: true,
              },
            },
          },
          orderBy: {
            gradedAt: 'desc',
          },
        },
        answers: {
          include: {
            exam: {
              select: {
                title: true,
                startTime: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            results: true,
            answers: true,
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

    // Calculate performance metrics
    const averageScore =
      student.results.length > 0
        ? student.results.reduce((sum, result) => sum + result.score, 0) /
          student.results.length
        : 0;

    const recentExams = student.results.slice(0, 5).map(result => ({
      examTitle: result.exam.title,
      score: result.score,
      date: result.gradedAt,
      examDate: result.exam.startTime,
    }));

    const transformedStudent = {
      id: student.id,
      regNumber: student.regNumber,
      name: student.user.name,
      email: student.user.email,
      gender: student.gender,
      class: student.class,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      dateOfBirth: student.dateOfBirth,
      address: student.address,
      status: student.status,
      avatar: student.avatar,
      lastLogin: student.lastLogin,
      lastExamTaken: student.lastExamTaken,
      performanceScore: Math.round(averageScore),
      totalExams: student._count.results,
      totalAnswers: student._count.answers,
      recentExams,
      createdAt: student.user.createdAt.toISOString(),
      updatedAt: student.user.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedStudent);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateStudentSchema.parse(body);

    // Check if student exists and belongs to school
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's unique
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: existingStudent.userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Update student and user data in transaction
    const updatedStudent = await prisma.$transaction(async tx => {
      // Update user data if provided
      if (validatedData.name || validatedData.email) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: {
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.email && { email: validatedData.email }),
          },
        });
      }

      // Update student data
      const student = await tx.student.update({
        where: { id },
        data: {
          gender: validatedData.gender,
          classId: validatedData.classId === null ? null : validatedData.classId,
          parentPhone: validatedData.parentPhone || undefined,
          parentEmail: validatedData.parentEmail && validatedData.parentEmail !== '' ? validatedData.parentEmail : undefined,
          dateOfBirth: validatedData.dateOfBirth || undefined,
          address: validatedData.address || undefined,
          status: validatedData.status,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true,
              academicYear: true,
            },
          },
        },
      });

      return student;
    });

    const transformedStudent = {
      id: updatedStudent.id,
      regNumber: updatedStudent.regNumber,
      name: updatedStudent.user.name,
      email: updatedStudent.user.email,
      gender: updatedStudent.gender,
      class: updatedStudent.class,
      parentPhone: updatedStudent.parentPhone,
      parentEmail: updatedStudent.parentEmail,
      dateOfBirth: updatedStudent.dateOfBirth,
      address: updatedStudent.address,
      status: updatedStudent.status,
      avatar: updatedStudent.avatar,
      lastLogin: updatedStudent.lastLogin,
      lastExamTaken: updatedStudent.lastExamTaken,
      createdAt: updatedStudent.user.createdAt.toISOString(),
      updatedAt: updatedStudent.user.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedStudent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if student exists and belongs to school
    const student = await prisma.student.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    // Delete student and related data in transaction
    await prisma.$transaction([
      prisma.answer.deleteMany({
        where: { studentId: id },
      }),
      prisma.result.deleteMany({
        where: { studentId: id },
      }),
      prisma.student.delete({
        where: { id },
      }),
      prisma.user.delete({
        where: { id: student.userId },
      }),
    ]);

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
