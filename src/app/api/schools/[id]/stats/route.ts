import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: schoolId } = await params;

    const stats = await prisma.$transaction(async tx => {
      // Get school details
      const school = await tx.school.findUnique({
        where: { id: schoolId },
        include: {
          _count: {
            select: {
              students: true,
              exams: true,
              users: true,
            },
          },
        },
      });

      if (!school) {
        throw new Error('School not found');
      }

      // Get staff count (school admins + teachers)
      const staffCount = await tx.user.count({
        where: {
          schoolId,
          role: { in: ['SCHOOL_ADMIN'] },
        },
      });

      // Get active exams count
      const activeExams = await tx.exam.count({
        where: {
          schoolId,
          startTime: { lte: new Date() },
          endTime: { gte: new Date() },
        },
      });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentStudents = await tx.user
        .count({
          where: {
            schoolId,
            role: 'STUDENT',
            createdAt: { gte: thirtyDaysAgo },
          },
        })
        .catch(() => 0);

      const recentExams = await tx.exam
        .count({
          where: {
            schoolId,
            createdAt: { gte: thirtyDaysAgo },
          },
        })
        .catch(() => 0);

      return {
        school: {
          id: school.id,
          name: school.name,
          status: school.status,
          createdAt: school.createdAt,
        },
        totalStudents: school._count.students,
        totalStaff: staffCount,
        totalExams: school._count.exams,
        activeExams,
        recentStudents,
        recentExams,
      };
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching school stats:', error);
    if (error instanceof Error && error.message === 'School not found') {
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
