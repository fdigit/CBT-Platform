import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      resultIds,
      classId,
      subjectId,
      term,
      session: academicSession,
    } = body;

    if (!resultIds && (!classId || !subjectId || !term || !academicSession)) {
      return NextResponse.json(
        {
          error:
            'Either resultIds or (classId, subjectId, term, session) required',
        },
        { status: 400 }
      );
    }

    const whereClause: any = {
      teacherId: teacher.id,
      status: 'DRAFT',
    };

    if (resultIds && Array.isArray(resultIds)) {
      whereClause.id = { in: resultIds };
    } else {
      whereClause.classId = classId;
      whereClause.subjectId = subjectId;
      whereClause.term = term;
      whereClause.session = academicSession;
    }

    const resultsToSubmit = await prisma.academicResult.findMany({
      where: whereClause,
    });

    if (resultsToSubmit.length === 0) {
      return NextResponse.json(
        { error: 'No draft results found to submit' },
        { status: 404 }
      );
    }

    const updatedResults = await prisma.academicResult.updateMany({
      where: whereClause,
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully submitted ${updatedResults.count} results for approval`,
      count: updatedResults.count,
    });
  } catch (error) {
    console.error('Error submitting results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
