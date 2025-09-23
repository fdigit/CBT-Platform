import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  description: z.string().optional(),
  maxStudents: z.number().int().positive().default(40),
  room: z.string().optional(),
  teacherIds: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
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
    const classItem = await prisma.class.findFirst({
      where: {
        id: id,
        schoolId: session.user.schoolId,
      },
      include: {
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            exams: true,
          },
        },
      },
    });

    if (!classItem) {
      return NextResponse.json({ message: 'Class not found' }, { status: 404 });
    }

    const transformedClass = {
      id: classItem.id,
      name: classItem.name,
      section: classItem.section,
      academicYear: classItem.academicYear,
      description: classItem.description,
      maxStudents: classItem.maxStudents,
      room: classItem.room,
      status: classItem.status,
      studentCount: classItem._count.students,
      examCount: classItem._count.exams,
      teachers: classItem.teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email,
        employeeId: teacher.employeeId,
      })),
      createdAt: classItem.createdAt.toISOString(),
      updatedAt: classItem.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedClass);
  } catch (error) {
    console.error('Error fetching class:', error);
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
    const validatedData = updateClassSchema.parse(body);

    // Check if class exists and belongs to the school
    const existingClass = await prisma.class.findFirst({
      where: {
        id: id,
        schoolId: session.user.schoolId,
      },
    });

    if (!existingClass) {
      return NextResponse.json({ message: 'Class not found' }, { status: 404 });
    }

    // Check if another class with same name, section, and academic year already exists (excluding current class)
    const duplicateClass = await prisma.class.findFirst({
      where: {
        schoolId: session.user.schoolId,
        name: validatedData.name,
        section: validatedData.section || null,
        academicYear: validatedData.academicYear,
        id: { not: id },
      },
    });

    if (duplicateClass) {
      return NextResponse.json(
        {
          message:
            'Class with this name, section, and academic year already exists',
        },
        { status: 400 }
      );
    }

    // Verify teachers exist and belong to the school if provided
    if (validatedData.teacherIds && validatedData.teacherIds.length > 0) {
      const teachers = await prisma.teacher.findMany({
        where: {
          id: { in: validatedData.teacherIds },
          schoolId: session.user.schoolId,
        },
      });

      if (teachers.length !== validatedData.teacherIds.length) {
        return NextResponse.json(
          {
            message: 'Some teachers not found or do not belong to your school',
          },
          { status: 400 }
        );
      }
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: id },
      data: {
        name: validatedData.name,
        section: validatedData.section,
        academicYear: validatedData.academicYear,
        description: validatedData.description,
        maxStudents: validatedData.maxStudents,
        room: validatedData.room,
        status: validatedData.status || existingClass.status,
        teachers: {
          set: validatedData.teacherIds?.map(id => ({ id })) || [],
        },
      },
      include: {
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            exams: true,
          },
        },
      },
    });

    const transformedClass = {
      id: updatedClass.id,
      name: updatedClass.name,
      section: updatedClass.section,
      academicYear: updatedClass.academicYear,
      description: updatedClass.description,
      maxStudents: updatedClass.maxStudents,
      room: updatedClass.room,
      status: updatedClass.status,
      studentCount: updatedClass._count.students,
      examCount: updatedClass._count.exams,
      teachers: updatedClass.teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email,
        employeeId: teacher.employeeId,
      })),
      createdAt: updatedClass.createdAt.toISOString(),
      updatedAt: updatedClass.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedClass);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating class:', error);
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
    // Check if class exists and belongs to the school
    const existingClass = await prisma.class.findFirst({
      where: {
        id: id,
        schoolId: session.user.schoolId,
      },
      include: {
        _count: {
          select: {
            students: true,
            exams: true,
          },
        },
      },
    });

    if (!existingClass) {
      return NextResponse.json({ message: 'Class not found' }, { status: 404 });
    }

    // Check if class has students or exams - prevent deletion if it does
    if (existingClass._count.students > 0) {
      return NextResponse.json(
        {
          message:
            'Cannot delete class with enrolled students. Please move students to another class first.',
        },
        { status: 400 }
      );
    }

    if (existingClass._count.exams > 0) {
      return NextResponse.json(
        {
          message:
            'Cannot delete class with existing exams. Please remove or reassign exams first.',
        },
        { status: 400 }
      );
    }

    // Delete the class
    await prisma.class.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
