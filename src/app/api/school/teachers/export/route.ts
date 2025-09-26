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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';

    if (!['excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        { message: 'Invalid format. Use excel or pdf' },
        { status: 400 }
      );
    }

    const schoolId = session.user.schoolId!;

    // Fetch all teachers for export
    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId: schoolId,
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
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                academicYear: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    if (format === 'excel') {
      // For Excel export, we'll return CSV data
      // In a real implementation, you might use a library like 'xlsx' or 'exceljs'

      const headers = [
        'Name',
        'Employee ID',
        'Email',
        'Phone',
        'Qualification',
        'Specialization',
        'Experience (Years)',
        'Status',
        'Hire Date',
        'Classes Count',
        'Classes',
        'Address',
        'Created Date',
      ];

      const csvData = teachers.map(teacher => [
        teacher.user.name,
        teacher.employeeId,
        teacher.user.email,
        teacher.phone || '',
        teacher.qualification || '',
        teacher.specialization || '',
        teacher.experience?.toString() || '0',
        teacher.status,
        teacher.hireDate ? teacher.hireDate.toISOString().split('T')[0] : '',
        teacher.classes.length.toString(),
        teacher.classes
          .map(
            cls =>
              `${cls.class.name}${cls.class.section ? ` - ${cls.class.section}` : ''} (${cls.class.academicYear})`
          )
          .join('; '),
        teacher.address || '',
        teacher.user.createdAt.toISOString().split('T')[0],
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="teachers_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // For PDF export, we'll return HTML that can be converted to PDF
      // In a real implementation, you might use a library like 'puppeteer' or 'jspdf'

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Teachers Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            .status { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .status-active { background-color: #d1fae5; color: #065f46; }
            .status-suspended { background-color: #fee2e2; color: #991b1b; }
            .status-leave { background-color: #fef3c7; color: #92400e; }
            .status-terminated { background-color: #f3f4f6; color: #374151; }
          </style>
        </head>
        <body>
          <h1>Teachers Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Teachers:</strong> ${teachers.length}</p>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Status</th>
                <th>Classes</th>
                <th>Hire Date</th>
              </tr>
            </thead>
            <tbody>
              ${teachers
                .map(
                  teacher => `
                <tr>
                  <td>${teacher.user.name}</td>
                  <td>${teacher.employeeId}</td>
                  <td>${teacher.user.email}</td>
                  <td>${teacher.specialization || '-'}</td>
                  <td>
                    <span class="status status-${teacher.status.toLowerCase()}">
                      ${teacher.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>${teacher.classes.length}</td>
                  <td>${teacher.hireDate ? teacher.hireDate.toISOString().split('T')[0] : '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="teachers_report_${new Date().toISOString().split('T')[0]}.html"`,
        },
      });
    }

    return NextResponse.json({ message: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting teachers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
