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
    const email = searchParams.get('email');
    const employeeId = searchParams.get('employeeId');

    if (!email && !employeeId) {
      return NextResponse.json(
        { message: 'Email or employeeId parameter is required' },
        { status: 400 }
      );
    }

    let exists = false;

    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      exists = !!existingUser;
    }

    if (employeeId && !exists) {
      const existingTeacher = await prisma.teacher.findFirst({
        where: {
          employeeId,
          schoolId: session.user.schoolId, // Scope to current school
        },
      });
      exists = !!existingTeacher;
    }

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
