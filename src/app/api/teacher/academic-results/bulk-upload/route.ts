import { authOptions } from '@/lib/auth';
import { calculateGrade, DEFAULT_GRADING_SCALE } from '@/lib/grading';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const classId = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;
    const term = formData.get('term') as string;
    const academicSession = formData.get('session') as string;

    if (!file || !classId || !subjectId || !term || !academicSession) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const teacherSubject = await prisma.classSubject.findFirst({
      where: {
        teacherId: teacher.id,
        classId,
        subjectId,
      },
    });

    if (!teacherSubject) {
      return NextResponse.json(
        {
          error:
            'You are not authorized to add results for this subject in this class',
        },
        { status: 403 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      );
    }

    const gradingScales = await prisma.gradingScale.findMany({
      where: { schoolId: teacher.schoolId, isActive: true },
      orderBy: { minScore: 'desc' },
    });

    const gradingScale =
      gradingScales.length > 0
        ? gradingScales.map(scale => ({
            minScore: scale.minScore,
            maxScore: scale.maxScore,
            grade: scale.grade,
            gradePoint: scale.gradePoint,
            remark: scale.remark,
          }))
        : DEFAULT_GRADING_SCALE;

    const results = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ row: number; error: string; data?: any }>,
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        const regNumber =
          row['Reg Number'] ||
          row['RegNumber'] ||
          row['Registration Number'] ||
          row['reg_number'];
        const caScore = parseFloat(
          row['CA Score'] || row['CA'] || row['ca_score'] || 0
        );
        const examScore = parseFloat(
          row['Exam Score'] || row['Exam'] || row['exam_score'] || 0
        );
        const remarks =
          row['Remarks'] || row['Teacher Comment'] || row['remarks'] || '';

        if (!regNumber) {
          results.errors.push({
            row: rowNumber,
            error: 'Missing registration number',
            data: row,
          });
          continue;
        }

        if (isNaN(caScore) || caScore < 0 || caScore > 40) {
          results.errors.push({
            row: rowNumber,
            error: `Invalid CA score: ${caScore} (must be 0-40)`,
            data: row,
          });
          continue;
        }

        if (isNaN(examScore) || examScore < 0 || examScore > 60) {
          results.errors.push({
            row: rowNumber,
            error: `Invalid Exam score: ${examScore} (must be 0-60)`,
            data: row,
          });
          continue;
        }

        const student = await prisma.student.findUnique({
          where: { regNumber: regNumber.toString().trim() },
        });

        if (!student) {
          results.errors.push({
            row: rowNumber,
            error: `Student not found with reg number: ${regNumber}`,
            data: row,
          });
          continue;
        }

        if (student.classId !== classId) {
          results.errors.push({
            row: rowNumber,
            error: `Student ${regNumber} does not belong to this class`,
            data: row,
          });
          continue;
        }

        if (student.schoolId !== teacher.schoolId) {
          results.errors.push({
            row: rowNumber,
            error: `Student ${regNumber} does not belong to your school`,
            data: row,
          });
          continue;
        }

        const totalScore = caScore + examScore;
        const gradeResult = calculateGrade(totalScore, 100, gradingScale);

        const existingResult = await prisma.academicResult.findUnique({
          where: {
            studentId_subjectId_term_session: {
              studentId: student.id,
              subjectId,
              term,
              session: academicSession,
            },
          },
        });

        await prisma.academicResult.upsert({
          where: {
            studentId_subjectId_term_session: {
              studentId: student.id,
              subjectId,
              term,
              session: academicSession,
            },
          },
          update: {
            caScore,
            examScore,
            totalScore,
            actualGrade: gradeResult.actualGrade,
            gradePoint: gradeResult.gradePoint,
            remark: gradeResult.remark,
            scoresObtained: totalScore,
            teacherComment: remarks,
            updatedAt: new Date(),
          },
          create: {
            studentId: student.id,
            subjectId,
            teacherId: teacher.id,
            classId,
            schoolId: teacher.schoolId,
            term,
            session: academicSession,
            caScore,
            examScore,
            totalScore,
            actualGrade: gradeResult.actualGrade,
            gradePoint: gradeResult.gradePoint,
            remark: gradeResult.remark,
            scoresObtainable: 100,
            scoresObtained: totalScore,
            teacherComment: remarks,
            status: 'DRAFT',
          },
        });

        if (existingResult) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
          data: row,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk upload complete. Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors.length}`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
