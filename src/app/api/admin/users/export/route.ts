import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Get all users with their related data
    const users = await prisma.user.findMany({
      include: {
        school: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        StudentProfile: {
          select: {
            regNumber: true,
          },
        },
        SchoolAdminProfile: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Generate CSV content
      const headers = [
        'ID',
        'Name',
        'Email',
        'Role',
        'School',
        'School Status',
        'Registration Number',
        'Created At',
        'Updated At',
      ];

      const csvRows = [
        headers.join(','),
        ...users.map(user =>
          [
            user.id,
            `"${user.name}"`,
            `"${user.email}"`,
            user.role,
            user.school ? `"${user.school.name}"` : 'No School',
            user.school ? user.school.status : 'N/A',
            user.StudentProfile?.regNumber || 'N/A',
            user.createdAt.toISOString().split('T')[0],
            user.updatedAt.toISOString().split('T')[0],
          ].join(',')
        ),
      ];

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      // Generate JSON content
      const jsonData = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school
          ? {
              id: user.school.id,
              name: user.school.name,
              status: user.school.status,
            }
          : null,
        regNumber: user.StudentProfile?.regNumber || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }));

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      return NextResponse.json(
        { message: 'Unsupported format. Use csv or json.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
