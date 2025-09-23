import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: examId } = await params;

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Verify exam belongs to teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        teacherId: teacher.id,
      },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true, section: true } },
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            points: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found or access denied' },
        { status: 404 }
      );
    }

    // Get all student results for this exam
    const results = await prisma.result.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            class: { select: { name: true, section: true } },
          },
        },
        exam: {
          select: {
            title: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
      orderBy: [{ score: 'desc' }, { student: { user: { name: 'asc' } } }],
    });

    // Get all attempts for additional context
    const attempts = await prisma.examAttempt.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    // Get detailed answers for each student
    const studentAnswers = await prisma.answer.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        question: {
          select: {
            id: true,
            text: true,
            type: true,
            points: true,
            order: true,
            correctAnswer: true,
          },
        },
      },
      orderBy: [
        { student: { user: { name: 'asc' } } },
        { question: { order: 'asc' } },
      ],
    });

    // Calculate statistics
    const totalStudents = results.length;
    const passedStudents = results.filter(r =>
      exam.passingMarks ? r.score >= exam.passingMarks : r.score > 0
    ).length;
    const averageScore =
      totalStudents > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / totalStudents
        : 0;
    const highestScore =
      results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
    const lowestScore =
      results.length > 0 ? Math.min(...results.map(r => r.score)) : 0;

    // Group answers by student for detailed view
    const answersByStudent = studentAnswers.reduce(
      (acc, answer) => {
        const studentId = answer.studentId;
        if (!acc[studentId]) {
          acc[studentId] = {
            studentName: answer.student.user.name,
            answers: [],
          };
        }
        acc[studentId].answers.push({
          questionId: answer.questionId,
          questionText: answer.question.text,
          questionType: answer.question.type,
          maxPoints: answer.question.points,
          studentAnswer: answer.response,
          correctAnswer: answer.question.correctAnswer,
          pointsAwarded: answer.pointsAwarded,
          isCorrect: answer.isCorrect,
          submittedAt: answer.createdAt,
        });
        return acc;
      },
      {} as Record<string, any>
    );

    // Format results with additional data
    const formattedResults = results.map(result => {
      const studentAttempts = attempts.filter(
        a => a.studentId === result.studentId
      );
      const latestAttempt = studentAttempts.sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )[0];

      const studentAnswersData =
        answersByStudent[result.studentId]?.answers || [];
      const objectiveScore = studentAnswersData
        .filter(
          (a: any) =>
            ['MCQ', 'TRUE_FALSE'].includes(a.questionType) &&
            a.pointsAwarded !== null
        )
        .reduce((sum: number, a: any) => sum + (a.pointsAwarded || 0), 0);

      const subjectiveScore = studentAnswersData
        .filter(
          (a: any) =>
            ['ESSAY', 'SHORT_ANSWER'].includes(a.questionType) &&
            a.pointsAwarded !== null
        )
        .reduce((sum: number, a: any) => sum + (a.pointsAwarded || 0), 0);

      const unansweredQuestions = studentAnswersData.filter(
        (a: any) => !a.studentAnswer || a.studentAnswer.trim() === ''
      ).length;

      return {
        id: result.id,
        studentId: result.studentId,
        studentName: result.student.user.name,
        studentEmail: result.student.user.email,
        studentClass: result.student.class
          ? `${result.student.class.name} ${result.student.class.section || ''}`
          : 'N/A',
        regNumber: result.student.regNumber,
        score: result.score,
        totalMarks: exam.totalMarks || 0,
        percentage: exam.totalMarks
          ? (result.score / exam.totalMarks) * 100
          : 0,
        passed: exam.passingMarks
          ? result.score >= exam.passingMarks
          : result.score > 0,
        grade: calculateGrade(result.score, exam.totalMarks || 0),
        submittedAt: result.gradedAt || latestAttempt?.submittedAt,
        timeSpent: latestAttempt?.timeSpent,
        attemptNumber: latestAttempt?.attemptNumber || 1,
        objectiveScore,
        subjectiveScore,
        unansweredQuestions,
        totalQuestions: exam.questions.length,
        answers: studentAnswersData,
      };
    });

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject?.name,
        class: exam.class
          ? `${exam.class.name} ${exam.class.section || ''}`
          : 'All Classes',
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        totalQuestions: exam.questions.length,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
      },
      statistics: {
        totalStudents,
        passedStudents,
        failedStudents: totalStudents - passedStudents,
        passRate:
          totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore,
        averagePercentage: exam.totalMarks
          ? (averageScore / exam.totalMarks) * 100
          : 0,
      },
      results: formattedResults,
    });
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
