import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, UserListResponse } from '@/types/models';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const teacherId = session.user.id;
    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID not found' },
        { status: 400 }
      );
    }

    // Get teacher's assigned classes and subjects
    const teacherProfile = await prisma.teacher.findUnique({
      where: { userId: teacherId },
      include: {
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get class IDs that teacher is assigned to
    const teacherClassIds = teacherProfile.classSubjects.map(cs => cs.classId);

    if (teacherClassIds.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
      });
    }

    // Build where clause for students
    const where: any = {
      role: 'STUDENT',
      schoolId,
      StudentProfile: {
        classId: { in: teacherClassIds },
      },
    };

    // Apply filters
    if (classId) {
      where.StudentProfile.classId = classId;
    }

    if (subjectId) {
      // Filter by students in classes where teacher teaches this subject
      const subjectClassIds = teacherProfile.classSubjects
        .filter(cs => cs.subjectId === subjectId)
        .map(cs => cs.classId);

      if (subjectClassIds.length > 0) {
        where.StudentProfile.classId = { in: subjectClassIds };
      } else {
        // Teacher doesn't teach this subject, return empty
        return NextResponse.json({
          users: [],
          pagination: { page: 1, limit, total: 0, pages: 0 },
        });
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          StudentProfile: {
            regNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get students with pagination
    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        StudentProfile: {
          select: {
            class: {
              select: {
                name: true,
                section: true,
              },
            },
            regNumber: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform students to include className and section
    const transformedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role as Role,
      className: student.StudentProfile?.class?.name,
      section: student.StudentProfile?.class?.section || undefined,
    }));

    const response: UserListResponse = {
      users: transformedStudents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
