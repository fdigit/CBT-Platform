import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        _count: {
          select: {
            teachers: true,
            classSubjects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.subject.count({ where });

    return NextResponse.json({
      subjects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('POST /api/school/subjects - Session:', {
      userId: session?.user?.id,
      role: session?.user?.role,
      schoolId: session?.user?.schoolId,
    });

    if (!session) {
      console.log('No session found');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    if (session.user.role !== 'SCHOOL_ADMIN') {
      console.log('Unauthorized access attempt - Role:', session.user.role);
      return NextResponse.json({ message: 'Unauthorized - School admin access required' }, { status: 403 });
    }

    if (!session.user.schoolId) {
      console.log('No school ID in session');
      return NextResponse.json({ message: 'No school assigned to user' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }

    const validatedData = createSubjectSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Check if subject already exists for this school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        schoolId: session.user.schoolId,
        OR: [
          { name: validatedData.name },
          ...(validatedData.code ? [{ code: validatedData.code }] : []),
        ],
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        { message: 'Subject with this name or code already exists' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        ...validatedData,
        schoolId: session.user.schoolId!,
      },
      include: {
        _count: {
          select: {
            teachers: true,
            classSubjects: true,
          },
        },
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: error.errors.map(e => ({ 
            path: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }

    console.error('Error creating subject:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
