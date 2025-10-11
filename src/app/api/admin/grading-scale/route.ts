import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId') || session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const gradingScales = await prisma.gradingScale.findMany({
      where: { schoolId, isActive: true },
      orderBy: { minScore: 'desc' },
    });

    return NextResponse.json({
      success: true,
      gradingScales,
    });
  } catch (error) {
    console.error('Error fetching grading scales:', error);
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
    const { schoolId: requestSchoolId, gradingScales } = body;

    const schoolId = requestSchoolId || session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    if (
      !gradingScales ||
      !Array.isArray(gradingScales) ||
      gradingScales.length === 0
    ) {
      return NextResponse.json(
        { error: 'Grading scales array is required' },
        { status: 400 }
      );
    }

    for (const scale of gradingScales) {
      if (
        !scale.minScore ||
        !scale.maxScore ||
        !scale.grade ||
        !scale.gradePoint ||
        !scale.remark
      ) {
        return NextResponse.json(
          { error: 'All grading scale fields are required' },
          { status: 400 }
        );
      }

      if (
        scale.minScore < 0 ||
        scale.maxScore > 100 ||
        scale.minScore >= scale.maxScore
      ) {
        return NextResponse.json(
          { error: 'Invalid score ranges' },
          { status: 400 }
        );
      }
    }

    await prisma.gradingScale.updateMany({
      where: { schoolId },
      data: { isActive: false },
    });

    const createdScales = await Promise.all(
      gradingScales.map(scale =>
        prisma.gradingScale.create({
          data: {
            schoolId,
            minScore: scale.minScore,
            maxScore: scale.maxScore,
            grade: scale.grade,
            gradePoint: scale.gradePoint,
            remark: scale.remark,
            isActive: true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Grading scales updated successfully',
      gradingScales: createdScales,
    });
  } catch (error) {
    console.error('Error creating grading scales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
