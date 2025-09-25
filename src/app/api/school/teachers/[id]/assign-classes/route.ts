import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignClassesSchema = z.object({
  classIds: z.array(z.string()).min(1, 'At least one class must be selected'),
});

export async function POST(
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
    const validatedData = assignClassesSchema.parse(body);

    // Check if teacher exists and belongs to the school
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: id,
        schoolId: session.user.schoolId,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Verify all classes exist and belong to the school
    const classes = await prisma.class.findMany({
      where: {
        id: { in: validatedData.classIds },
        schoolId: session.user.schoolId,
      },
    });

    if (classes.length !== validatedData.classIds.length) {
      return NextResponse.json(
        { message: 'Some classes not found or do not belong to your school' },
        { status: 400 }
      );
    }

    // Get current class assignments
    const currentAssignments = await prisma.class.findMany({
      where: {
        teachers: {
          some: {
            id: id,
          },
        },
      },
      select: { id: true },
    });

    const currentClassIds = currentAssignments.map(c => c.id);
    const newClassIds = validatedData.classIds.filter(
      id => !currentClassIds.includes(id)
    );
    const removedClassIds = currentClassIds.filter(
      id => !validatedData.classIds.includes(id)
    );

    // Update teacher's class assignments
    await prisma.teacher.update({
      where: { id: id },
      data: {
        classes: {
          set: validatedData.classIds.map(id => ({ id })),
        },
      },
    });

    // Get updated teacher with classes
    const updatedTeacher = await prisma.teacher.findUnique({
      where: { id: id },
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
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });

    if (!updatedTeacher) {
      return NextResponse.json(
        { message: 'Teacher not found after update' },
        { status: 404 }
      );
    }

    const transformedTeacher = {
      id: updatedTeacher.id,
      employeeId: updatedTeacher.employeeId,
      name: updatedTeacher.user.name,
      email: updatedTeacher.user.email,
      qualification: updatedTeacher.qualification,
      specialization: updatedTeacher.specialization,
      experience: updatedTeacher.experience,
      phone: updatedTeacher.phone,
      address: updatedTeacher.address,
      avatar: updatedTeacher.avatar,
      status: updatedTeacher.status,
      hireDate: updatedTeacher.hireDate?.toISOString(),
      lastLogin: updatedTeacher.lastLogin?.toISOString(),
      classCount: updatedTeacher.classes.length,
      classes: updatedTeacher.classes.map(teacherClass => ({
        id: teacherClass.class.id,
        name: teacherClass.class.name,
        section: teacherClass.class.section,
        academicYear: teacherClass.class.academicYear,
        displayName: `${teacherClass.class.name}${teacherClass.class.section ? ` - ${teacherClass.class.section}` : ''}`,
      })),
      createdAt: updatedTeacher.user.createdAt.toISOString(),
      updatedAt: updatedTeacher.user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      message: 'Class assignments updated successfully',
      teacher: transformedTeacher,
      summary: {
        added: newClassIds.length,
        removed: removedClassIds.length,
        total: validatedData.classIds.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error assigning classes to teacher:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Get teacher's current class assignments
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: id,
        schoolId: session.user.schoolId,
      },
      include: {
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                academicYear: true,
                _count: {
                  select: {
                    students: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Get all available classes for the school
    const allClasses = await prisma.class.findMany({
      where: {
        schoolId: session.user.schoolId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        section: true,
        academicYear: true,
        maxStudents: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [{ academicYear: 'desc' }, { name: 'asc' }, { section: 'asc' }],
    });

    const assignedClassIds = teacher.classes.map(c => c.class.id);

    return NextResponse.json({
      assignedClasses: teacher.classes.map(teacherClass => ({
        id: teacherClass.class.id,
        name: teacherClass.class.name,
        section: teacherClass.class.section,
        academicYear: teacherClass.class.academicYear,
        studentCount: teacherClass.class._count.students,
        displayName: `${teacherClass.class.name}${teacherClass.class.section ? ` - ${teacherClass.class.section}` : ''}`,
      })),
      availableClasses: allClasses.map(cls => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        academicYear: cls.academicYear,
        maxStudents: cls.maxStudents,
        studentCount: cls._count.students,
        displayName: `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`,
        isAssigned: assignedClassIds.includes(cls.id),
      })),
    });
  } catch (error) {
    console.error('Error fetching teacher class assignments:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
