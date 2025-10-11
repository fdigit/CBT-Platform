import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

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
      resultIds,
      classId,
      term,
      session: academicSession,
      schoolId,
    } = body;

    if (!resultIds && (!classId || !term || !academicSession)) {
      return NextResponse.json(
        { error: 'Either resultIds or (classId, term, session) required' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      status: 'APPROVED',
    };

    if (session.user.role === 'SCHOOL_ADMIN') {
      whereClause.schoolId = session.user.schoolId;
    } else if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (resultIds && Array.isArray(resultIds)) {
      whereClause.id = { in: resultIds };
    } else {
      whereClause.classId = classId;
      whereClause.term = term;
      whereClause.session = academicSession;
    }

    const resultsToPublish = await prisma.academicResult.findMany({
      where: whereClause,
    });

    if (resultsToPublish.length === 0) {
      return NextResponse.json(
        { error: 'No approved results found to publish' },
        { status: 404 }
      );
    }

    const updatedResults = await prisma.academicResult.updateMany({
      where: whereClause,
      data: {
        status: 'PUBLISHED',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully published ${updatedResults.count} results`,
      count: updatedResults.count,
    });
  } catch (error) {
    console.error('Error publishing results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
