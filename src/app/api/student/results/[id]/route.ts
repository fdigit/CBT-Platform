import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: resultId } = await params;

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { message: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Get the specific result for this student
    const result = await prisma.result.findFirst({
      where: {
        id: resultId,
        studentId: student.id,
      },
      include: {
        exam: {
          include: {
            subject: { select: { name: true } },
            teacher: {
              include: {
                user: { select: { name: true } },
              },
            },
            questions: {
              select: {
                id: true,
                text: true,
                type: true,
                points: true,
                order: true,
                correctAnswer: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { message: 'Result not found' },
        { status: 404 }
      );
    }

    // Get student's answers for this exam
    const answers = await prisma.answer.findMany({
      where: {
        studentId: student.id,
        examId: result.examId,
      },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            type: true,
            points: true,
            correctAnswer: true,
          },
        },
      },
    });

    // Calculate grade
    const percentage = result.exam.totalMarks
      ? (result.score / result.exam.totalMarks) * 100
      : 0;
    const passed = result.exam.passingMarks
      ? result.score >= result.exam.passingMarks
      : result.score > 0;
    const grade = calculateGrade(result.score, result.exam.totalMarks || 0);

    // Format questions with student answers
    const questionsWithAnswers = result.exam.questions.map(question => {
      const studentAnswer = answers.find(a => a.questionId === question.id);

      return {
        id: question.id,
        text: question.text,
        type: question.type,
        points: question.points,
        studentAnswer: studentAnswer?.response || '',
        correctAnswer: question.correctAnswer || '',
        pointsAwarded: studentAnswer?.pointsAwarded || 0,
        isCorrect: studentAnswer?.isCorrect || false,
      };
    });

    // Format the response
    const formattedResult = {
      id: result.id,
      examTitle: result.exam.title,
      subject: result.exam.subject?.name || 'General',
      score: result.score,
      totalMarks: result.exam.totalMarks || 0,
      percentage: Math.round(percentage * 100) / 100,
      grade,
      passed,
      teacherRemark: '', // TODO: Add teacher remarks functionality
      teacher: result.exam.teacher?.user.name || 'N/A',
      examDate: result.exam.startTime,
      gradedAt: result.gradedAt,
      examId: result.exam.id,
      questions: questionsWithAnswers,
    };

    return NextResponse.json(formattedResult);
  } catch (error) {
    console.error('Error fetching student result detail:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate grade
function calculateGrade(score: number, totalMarks: number): string {
  if (totalMarks === 0) return 'N/A';

  const percentage = (score / totalMarks) * 100;

  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
}
