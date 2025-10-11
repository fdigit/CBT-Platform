import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let schoolId = searchParams.get('schoolId') || session.user.schoolId;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // If teacher, get their school ID
    if (session.user.role === 'TEACHER' && !schoolId) {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
      });
      if (teacher) {
        schoolId = teacher.schoolId;
      }
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = { schoolId };
    if (activeOnly) {
      whereClause.isActive = true;
    }

    const termSessions = await prisma.termSession.findMany({
      where: whereClause,
      orderBy: [{ session: 'desc' }, { startDate: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      termSessions,
    });
  } catch (error) {
    console.error('Error fetching term sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      schoolId: requestSchoolId,
      term,
      session: academicSession,
      startDate,
      endDate,
      isCurrent,
    } = body;

    const schoolId = requestSchoolId || session.user.schoolId;

    if (!schoolId || !term || !academicSession || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    if (isCurrent) {
      await prisma.termSession.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const termSession = await prisma.termSession.upsert({
      where: {
        schoolId_term_session: {
          schoolId,
          term,
          session: academicSession,
        },
      },
      update: {
        startDate: start,
        endDate: end,
        isCurrent: isCurrent || false,
        isActive: true,
      },
      create: {
        schoolId,
        term,
        session: academicSession,
        startDate: start,
        endDate: end,
        isCurrent: isCurrent || false,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Term session saved successfully',
      termSession,
    });
  } catch (error) {
    console.error('Error creating term session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Term session ID is required' },
        { status: 400 }
      );
    }

    await prisma.termSession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Term session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting term session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
