import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSchoolApprovalNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const schools = await prisma.school.findMany({
      where,
      include: {
        admins: {
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
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.school.count({ where });

    // Get status counts for summary
    const statusCounts = await prisma.school.groupBy({
      by: ['status'],
      _count: true,
    });

    const summary = {
      total: totalCount,
      pending: statusCounts.find(s => s.status === 'PENDING')?._count || 0,
      approved: statusCounts.find(s => s.status === 'APPROVED')?._count || 0,
      suspended: statusCounts.find(s => s.status === 'SUSPENDED')?._count || 0,
      rejected: statusCounts.find(s => s.status === 'REJECTED')?._count || 0,
    };

    return NextResponse.json({
      schools,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary,
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schoolId, status, action, ...updateData } = body;

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      );
    }

    let updatePayload: any = {};

    if (action) {
      // Handle specific actions
      switch (action) {
        case 'approve':
          updatePayload.status = 'APPROVED';
          break;
        case 'reject':
          updatePayload.status = 'REJECTED';
          break;
        case 'suspend':
          updatePayload.status = 'SUSPENDED';
          break;
        case 'reactivate':
          updatePayload.status = 'APPROVED';
          break;
        default:
          return NextResponse.json(
            { message: 'Invalid action' },
            { status: 400 }
          );
      }
    } else if (status) {
      // Direct status update
      if (!['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].includes(status)) {
        return NextResponse.json(
          {
            message:
              'Invalid status. Must be PENDING, APPROVED, SUSPENDED, or REJECTED',
          },
          { status: 400 }
        );
      }
      updatePayload.status = status;
    } else {
      // General update (for editing school details)
      updatePayload = { ...updateData };
    }

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: updatePayload,
      include: {
        admins: {
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
            users: true,
          },
        },
      },
    });

    // Create notification for status changes
    if (
      updatePayload.status &&
      ['APPROVED', 'REJECTED', 'SUSPENDED'].includes(updatePayload.status)
    ) {
      try {
        // For now, we'll skip the notification since we don't have school admin ID
        // TODO: Implement proper school admin notification
        // await createSchoolApprovalNotification(schoolAdminId, school.name, updatePayload.status === 'APPROVED')
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the update if notification fails
      }
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('id');

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      );
    }

    // Check if school has active students or exams
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            students: true,
            exams: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to a special value or hard delete
    // For now, we'll do a hard delete but you might want to implement soft delete
    await prisma.school.delete({
      where: { id: schoolId },
    });

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
