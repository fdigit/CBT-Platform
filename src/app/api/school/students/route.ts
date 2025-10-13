import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  regNumber: z.string().min(1, 'Registration number is required'),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  classId: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z
    .string()
    .email('Valid parent email required')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json(
        {
          message: 'School ID not found in session',
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const classFilter = searchParams.get('class') || '';
    const section = searchParams.get('section') || '';
    const gender = searchParams.get('gender') || '';
    const status = searchParams.get('status') || '';
    const academicYear = searchParams.get('academicYear') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId,
    };

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { regNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const students = await prisma.student.findMany({
      where,
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
          select: {
            score: true,
            gradedAt: true,
          },
          orderBy: {
            gradedAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: {
        user: {
          createdAt: 'desc',
        },
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.student.count({ where });

    // Transform data
    const transformedStudents = students.map(student => ({
      id: student.id,
      regNumber: student.regNumber,
      name: student.user.name,
      email: student.user.email,
      gender: student.gender,
      class: student.class
        ? `${student.class.name}${student.class.section ? ` - ${student.class.section}` : ''}`
        : null,
      classId: student.classId,
      className: student.class?.name,
      classSection: student.class?.section,
      academicYear: student.class?.academicYear,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      dateOfBirth: student.dateOfBirth,
      address: student.address,
      status: student.status,
      avatar: student.avatar,
      lastLogin: student.lastLogin,
      lastExamTaken: student.lastExamTaken,
      performanceScore: student.results[0]?.score || null,
      totalExams: student._count.results,
      createdAt: student.user.createdAt.toISOString(),
      updatedAt: student.user.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      students: transformedStudents,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching students:', error);

    // Provide more detailed error information
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        message: 'Failed to fetch students',
        error:
          process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('POST /api/school/students - Session:', {
      userId: session?.user?.id,
      role: session?.user?.role,
      schoolId: session?.user?.schoolId,
    });

    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'SCHOOL_ADMIN') {
      console.log('Unauthorized access attempt - Role:', session.user.role);
      return NextResponse.json(
        { message: 'Unauthorized - School admin access required' },
        { status: 403 }
      );
    }

    if (!session.user.schoolId) {
      console.log('No school ID in session');
      return NextResponse.json(
        { message: 'No school assigned to user' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validatedData = createStudentSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Check if email or regNumber already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      );
    }

    const existingStudent = await prisma.student.findUnique({
      where: { regNumber: validatedData.regNumber },
    });

    if (existingStudent) {
      return NextResponse.json(
        { message: 'Registration number already exists' },
        { status: 400 }
      );
    }

    // Generate password if not provided
    const password =
      validatedData.password ||
      `student${Math.random().toString(36).slice(-6)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and student in a transaction
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: 'STUDENT',
          schoolId: session.user.schoolId,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          schoolId: session.user.schoolId!,
          regNumber: validatedData.regNumber,
          gender: validatedData.gender,
          classId: validatedData.classId || undefined,
          parentPhone: validatedData.parentPhone || undefined,
          parentEmail:
            validatedData.parentEmail && validatedData.parentEmail !== ''
              ? validatedData.parentEmail
              : undefined,
          dateOfBirth: validatedData.dateOfBirth || undefined,
          address: validatedData.address || undefined,
          status: 'ACTIVE',
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

      return { user, student };
    });

    const transformedStudent = {
      id: result.student.id,
      regNumber: result.student.regNumber,
      name: result.student.user.name,
      email: result.student.user.email,
      gender: result.student.gender,
      class: result.student.class
        ? `${result.student.class.name}${result.student.class.section ? ` - ${result.student.class.section}` : ''}`
        : null,
      classId: result.student.classId,
      className: result.student.class?.name,
      classSection: result.student.class?.section,
      academicYear: result.student.class?.academicYear,
      parentPhone: result.student.parentPhone,
      parentEmail: result.student.parentEmail,
      dateOfBirth: result.student.dateOfBirth,
      address: result.student.address,
      status: result.student.status,
      avatar: result.student.avatar,
      lastLogin: result.student.lastLogin,
      lastExamTaken: result.student.lastExamTaken,
      performanceScore: null,
      totalExams: 0,
      createdAt: result.student.user.createdAt.toISOString(),
      updatedAt: result.student.user.updatedAt.toISOString(),
      tempPassword: validatedData.password ? undefined : password, // Return temp password if auto-generated
    };

    return NextResponse.json(transformedStudent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error creating student:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', errorMessage);

    return NextResponse.json(
      {
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
