import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = session.user.schoolId!;

    // Get basic teacher counts by status
    const teacherStats = await prisma.teacher.groupBy({
      by: ['status'],
      where: {
        schoolId: schoolId,
      },
      _count: {
        id: true,
      },
    });

    // Get total count
    const totalTeachers = await prisma.teacher.count({
      where: {
        schoolId: schoolId,
      },
    });

    // Transform status counts
    const statusCounts = {
      total: totalTeachers,
      active: 0,
      onLeave: 0,
      suspended: 0,
      retired: 0,
    };

    teacherStats.forEach(stat => {
      switch (stat.status) {
        case 'ACTIVE':
          statusCounts.active = stat._count.id;
          break;
        case 'ON_LEAVE':
          statusCounts.onLeave = stat._count.id;
          break;
        case 'SUSPENDED':
          statusCounts.suspended = stat._count.id;
          break;
        case 'TERMINATED':
          statusCounts.retired = stat._count.id;
          break;
      }
    });

    // Get teachers by subject (specialization)
    const subjectStats = await prisma.teacher.groupBy({
      by: ['specialization'],
      where: {
        schoolId: schoolId,
        specialization: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    const bySubject: Record<string, number> = {};
    subjectStats.forEach(stat => {
      if (stat.specialization) {
        bySubject[stat.specialization] = stat._count.id;
      }
    });

    // Mock data for roles (in real implementation, you might have a role field)
    const byRole = {
      teacher: statusCounts.active,
      hod: Math.floor(statusCounts.active * 0.1), // 10% are HODs
      adviser: Math.floor(statusCounts.active * 0.2), // 20% are advisers
      admin_staff: Math.floor(statusCounts.active * 0.05), // 5% are admin staff
    };

    // Get workload distribution (teachers with their class counts)
    const workloadData = await prisma.teacher.findMany({
      where: {
        schoolId: schoolId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        classes: {
          include: {
            class: {
              include: {
                students: true,
              },
            },
          },
        },
      },
    });

    const workloadDistribution = workloadData
      .map(teacher => {
        const classCount = teacher.classes.length;
        const studentCount = teacher.classes.reduce(
          (sum, cls) => sum + cls.class.students.length,
          0
        );

        // Calculate workload score (simple algorithm)
        const workloadScore = Math.min(
          100,
          classCount * 20 + studentCount * 0.5
        );

        return {
          teacherId: teacher.id,
          teacherName: teacher.user.name,
          classCount,
          studentCount,
          workloadScore: Math.round(workloadScore),
        };
      })
      .sort((a, b) => b.workloadScore - a.workloadScore);

    // Generate performance alerts (mock data - in real app, this would be based on actual performance metrics)
    const performanceAlerts = workloadData
      .filter(teacher => {
        const classCount = teacher.classes.length;
        const studentCount = teacher.classes.reduce(
          (sum, cls) => sum + cls.class.students.length,
          0
        );
        return classCount > 6 || studentCount > 200; // Overloaded teachers
      })
      .map(teacher => ({
        teacherId: teacher.id,
        teacherName: teacher.user.name,
        alertType: 'workload',
        description: 'Teacher may be overloaded with classes',
        severity: 'medium' as const,
      }));

    const stats = {
      ...statusCounts,
      bySubject,
      byRole,
      workloadDistribution,
      performanceAlerts,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
