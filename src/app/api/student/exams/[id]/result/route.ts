import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: examId } = await params
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Get exam with result and attempt details
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: student.schoolId,
        OR: [
          { classId: student.classId },
          { classId: null }
        ]
      },
      include: {
        subject: {
          select: { name: true, code: true }
        },
        teacher: {
          include: {
            user: { select: { name: true } }
          }
        },
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            points: true,
            explanation: true
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Get student's result
    const result = await prisma.result.findUnique({
      where: {
        studentId_examId: {
          studentId: student.id,
          examId
        }
      }
    })

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    // Get student's latest attempt
    const attempt = await prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId: student.id
      },
      orderBy: { attemptNumber: 'desc' }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Get all student answers for detailed breakdown
    const answers = await prisma.answer.findMany({
      where: {
        examId,
        studentId: student.id
      },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            type: true,
            points: true,
            explanation: true,
            correctAnswer: true
          }
        }
      }
    })

    // Calculate statistics
    const totalQuestions = exam.questions.length
    const answeredQuestions = answers.filter(a => a.response !== null && a.response !== '').length
    const correctAnswers = answers.filter(a => a.isCorrect === true).length
    const incorrectAnswers = answers.filter(a => a.isCorrect === false).length
    const unansweredQuestions = totalQuestions - answeredQuestions
    const objectiveScore = answers
      .filter(a => ['MCQ', 'TRUE_FALSE'].includes(a.question.type) && a.pointsAwarded !== null)
      .reduce((sum, a) => sum + (a.pointsAwarded || 0), 0)
    const subjectiveQuestions = answers.filter(a => ['ESSAY', 'SHORT_ANSWER'].includes(a.question.type)).length

    const totalMarks = exam.questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = totalMarks > 0 ? (result.score / totalMarks) * 100 : 0
    const passed = exam.passingMarks ? result.score >= exam.passingMarks : undefined

    // Prepare answer breakdown (only if exam allows immediate results)
    let answerBreakdown = undefined
    if (exam.showResultsImmediately) {
      answerBreakdown = answers.map(answer => ({
        questionId: answer.questionId,
        questionText: answer.question.text,
        questionType: answer.question.type,
        response: answer.response,
        isCorrect: answer.isCorrect,
        pointsAwarded: answer.pointsAwarded,
        maxPoints: answer.question.points,
        explanation: answer.question.explanation
      }))
    }

    const examResult = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      totalMarks,
      passingMarks: exam.passingMarks,
      subject: exam.subject,
      teacher: exam.teacher,
      result: {
        score: result.score,
        percentage,
        passed,
        gradedAt: result.gradedAt
      },
      attempt: {
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeSpent: attempt.timeSpent || 0,
        status: attempt.status
      },
      statistics: {
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        objectiveScore,
        subjectiveQuestions
      },
      answerBreakdown
    }

    return NextResponse.json({
      result: examResult
    })

  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
