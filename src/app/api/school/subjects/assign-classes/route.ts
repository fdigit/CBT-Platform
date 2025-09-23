import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignClassSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
  subjectIds: z
    .array(z.string())
    .min(1, 'At least one subject must be selected'),
});

const removeClassAssignmentSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = assignClassSchema.parse(body);

    // Verify class belongs to school
    const classItem = await prisma.class.findFirst({
      where: {
        id: validatedData.classId,
        schoolId: session.user.schoolId,
      },
    });

    if (!classItem) {
      return NextResponse.json({ message: 'Class not found' }, { status: 404 });
    }

    // Verify teacher belongs to school
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: validatedData.teacherId,
        schoolId: session.user.schoolId,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Verify all subjects belong to school and teacher is assigned to them
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: validatedData.subjectIds },
        schoolId: session.user.schoolId,
      },
    });

    if (subjects.length !== validatedData.subjectIds.length) {
      return NextResponse.json(
        { message: 'One or more subjects not found' },
        { status: 404 }
      );
    }

    // Verify teacher is assigned to all these subjects
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacherId: validatedData.teacherId,
        subjectId: { in: validatedData.subjectIds },
      },
    });

    const assignedSubjectIds = teacherSubjects.map(ts => ts.subjectId);
    const unassignedSubjects = validatedData.subjectIds.filter(
      id => !assignedSubjectIds.includes(id)
    );

    if (unassignedSubjects.length > 0) {
      return NextResponse.json(
        { message: 'Teacher is not assigned to all selected subjects' },
        { status: 400 }
      );
    }

    // Get existing class assignments
    const existingAssignments = await prisma.classSubject.findMany({
      where: {
        classId: validatedData.classId,
        teacherId: validatedData.teacherId,
        subjectId: { in: validatedData.subjectIds },
      },
    });

    const existingSubjectIds = existingAssignments.map(a => a.subjectId);
    const newSubjectIds = validatedData.subjectIds.filter(
      id => !existingSubjectIds.includes(id)
    );

    // Create new assignments
    const assignments = await Promise.all(
      newSubjectIds.map(subjectId =>
        prisma.classSubject.create({
          data: {
            classId: validatedData.classId,
            teacherId: validatedData.teacherId,
            subjectId,
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                academicYear: true,
              },
            },
            teacher: {
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
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: `Successfully assigned ${newSubjectIds.length} subjects to class`,
      assignments,
      skipped: existingSubjectIds.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error assigning subjects to class:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = removeClassAssignmentSchema.parse(body);

    // Verify all entities belong to school
    const [classItem, teacher, subject] = await Promise.all([
      prisma.class.findFirst({
        where: {
          id: validatedData.classId,
          schoolId: session.user.schoolId,
        },
      }),
      prisma.teacher.findFirst({
        where: {
          id: validatedData.teacherId,
          schoolId: session.user.schoolId,
        },
      }),
      prisma.subject.findFirst({
        where: {
          id: validatedData.subjectId,
          schoolId: session.user.schoolId,
        },
      }),
    ]);

    if (!classItem || !teacher || !subject) {
      return NextResponse.json(
        { message: 'Class, teacher, or subject not found' },
        { status: 404 }
      );
    }

    // Find and delete the assignment
    const assignment = await prisma.classSubject.findFirst({
      where: {
        classId: validatedData.classId,
        teacherId: validatedData.teacherId,
        subjectId: validatedData.subjectId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { message: 'Assignment not found' },
        { status: 404 }
      );
    }

    await prisma.classSubject.delete({
      where: {
        id: assignment.id,
      },
    });

    return NextResponse.json({
      message: 'Class assignment removed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error removing class assignment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get all class-teacher-subject assignments for this school
    const rawAssignments = await prisma.classSubject.findMany({
      where: {
        class: {
          schoolId: session.user.schoolId,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            academicYear: true,
          },
        },
        teacher: {
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
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { class: { section: 'asc' } },
        { teacher: { user: { name: 'asc' } } },
        { subject: { name: 'asc' } },
      ],
      skip: offset,
      take: limit,
    });

    // Transform to match the flattened teacher structure
    const assignments = rawAssignments.map(assignment => ({
      id: assignment.id,
      class: assignment.class,
      teacher: {
        id: assignment.teacher.id,
        name: assignment.teacher.user.name,
        email: assignment.teacher.user.email,
        employeeId: assignment.teacher.employeeId,
      },
      subject: assignment.subject,
      createdAt: assignment.createdAt,
    }));

    // Get total count
    const totalCount = await prisma.classSubject.count({
      where: {
        class: {
          schoolId: session.user.schoolId,
        },
      },
    });

    return NextResponse.json({
      assignments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching class-teacher-subject assignments:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
