import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get all subject assignments for this teacher
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    });

    // Get class assignments for each subject
    const subjectsWithClasses = await Promise.all(
      teacherSubjects.map(async ts => {
        const classAssignments = await prisma.classSubject.findMany({
          where: {
            teacherId: teacher.id,
            subjectId: ts.subject.id,
          },
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
          orderBy: [{ class: { name: 'asc' } }, { class: { section: 'asc' } }],
        });

        const classes = classAssignments.map(ca => ({
          id: ca.class.id,
          name: ca.class.name,
          section: ca.class.section,
          academicYear: ca.class.academicYear,
          studentCount: ca.class._count.students,
          displayName: `${ca.class.name}${ca.class.section ? ` ${ca.class.section}` : ''} (${ca.class.academicYear})`,
        }));

        // Calculate subject statistics (mock data for now)
        const totalStudents = classes.reduce(
          (sum, cls) => sum + cls.studentCount,
          0
        );
        const averageScore = Math.floor(Math.random() * 20) + 70; // Mock: 70-90
        const completionRate = Math.floor(Math.random() * 15) + 85; // Mock: 85-100
        const upcomingLessons = Math.floor(Math.random() * 5) + 1; // Mock: 1-5
        const pendingAssignments = Math.floor(Math.random() * 4); // Mock: 0-3

        // Mock recent activities
        const recentActivities = [
          {
            type: 'exam' as const,
            title: `${ts.subject.name} Test`,
            class: classes[0]?.displayName || 'No classes',
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            status: 'completed' as const,
          },
          {
            type: 'assignment' as const,
            title: `${ts.subject.name} Assignment`,
            class:
              classes[Math.floor(Math.random() * classes.length)]
                ?.displayName || 'No classes',
            date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            status: 'pending' as const,
          },
        ].slice(0, Math.floor(Math.random() * 3) + 1);

        return {
          id: ts.subject.id,
          name: ts.subject.name,
          code: ts.subject.code,
          description: ts.subject.description,
          status: ts.subject.status,
          totalClasses: classes.length,
          totalStudents,
          averageScore,
          completionRate,
          upcomingLessons,
          pendingAssignments,
          classes,
          recentActivities,
          assignmentId: ts.id,
        };
      })
    );

    return NextResponse.json({
      subjects: subjectsWithClasses,
      summary: {
        totalSubjects: subjectsWithClasses.length,
        totalClasses: subjectsWithClasses.reduce(
          (sum, subj) => sum + subj.totalClasses,
          0
        ),
        totalStudents: subjectsWithClasses.reduce(
          (sum, subj) => sum + subj.totalStudents,
          0
        ),
        averageScore:
          subjectsWithClasses.length > 0
            ? Math.round(
                subjectsWithClasses.reduce(
                  (sum, subj) => sum + subj.averageScore,
                  0
                ) / subjectsWithClasses.length
              )
            : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
