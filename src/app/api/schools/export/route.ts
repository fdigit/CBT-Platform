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
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build where clause (same as main schools API)
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
    });

    // Generate export data
    const exportData = schools.map(school => ({
      'School Name': school.name,
      Email: school.email,
      Phone: school.phone || 'N/A',
      Status: school.status,
      'Registration Date': new Date(school.createdAt).toLocaleDateString(),
      Students: school._count.students,
      Staff: school._count.users,
      Exams: school._count.exams,
      'Primary Admin': school.admins[0]?.user.name || 'N/A',
      'Admin Email': school.admins[0]?.user.email || 'N/A',
    }));

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers
            .map(header => `"${row[header as keyof typeof row] || ''}"`)
            .join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="schools-export.csv"',
        },
      });
    } else if (format === 'json') {
      // Return JSON for Excel processing on frontend
      return NextResponse.json(exportData);
    } else {
      // For now, return CSV for unsupported formats
      return NextResponse.json(
        { message: 'Format not supported yet. Please use CSV.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting schools:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
