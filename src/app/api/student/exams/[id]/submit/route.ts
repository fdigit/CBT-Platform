import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: examId } = await params
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { attemptId, timeSpent } = body

    if (!attemptId) {
      return NextResponse.json({ 
        error: 'Attempt ID is required' 
      }, { status: 400 })
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Get the exam attempt
    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        examId,
        studentId: student.id,
        status: 'IN_PROGRESS'
      }
    })

    if (!attempt) {
      return NextResponse.json({ 
        error: 'Invalid or already submitted exam attempt' 
      }, { status: 400 })
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: true
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const now = new Date()
    const endTime = new Date(exam.endTime)
    const isTimeout = now > endTime

    // Get all student answers for this exam
    const answers = await prisma.answer.findMany({
      where: {
        examId,
        studentId: student.id,
        attemptId
      },
      include: {
        question: true
      }
    })

    // Calculate total score
    let totalScore = 0
    let objectiveScore = 0
    let subjectiveQuestions = 0

    for (const answer of answers) {
      if (answer.pointsAwarded !== null) {
        totalScore += answer.pointsAwarded
        if (['MCQ', 'TRUE_FALSE'].includes(answer.question.type)) {
          objectiveScore += answer.pointsAwarded
        }
      }
      
      if (['ESSAY', 'SHORT_ANSWER'].includes(answer.question.type)) {
        subjectiveQuestions++
      }
    }

    // Update the attempt status
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: now,
        timeSpent: timeSpent || Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000),
        status: 'SUBMITTED'
      }
    })

    // Create or update result
    const result = await prisma.result.upsert({
      where: {
        studentId_examId: {
          studentId: student.id,
          examId
        }
      },
      update: {
        score: totalScore,
        gradedAt: now
      },
      create: {
        studentId: student.id,
        examId,
        score: totalScore
      }
    })

    // Update student's last exam taken
    await prisma.student.update({
      where: { id: student.id },
      data: { lastExamTaken: now }
    })

    // Prepare response data
    const responseData: any = {
      message: isTimeout ? 'Exam submitted due to timeout' : 'Exam submitted successfully',
      attempt: updatedAttempt,
      result: {
        id: result.id,
        score: totalScore,
        totalMarks: exam.questions.reduce((sum, q) => sum + q.points, 0),
        percentage: exam.questions.length > 0 ? 
          (totalScore / exam.questions.reduce((sum, q) => sum + q.points, 0)) * 100 : 0,
        passed: exam.passingMarks ? totalScore >= exam.passingMarks : null,
        objectiveScore,
        subjectiveQuestions,
        answeredQuestions: answers.length,
        totalQuestions: exam.questions.length
      }
    }

    // If exam allows immediate results, include detailed breakdown
    if (exam.showResultsImmediately) {
      const answerBreakdown = answers.map(answer => ({
        questionId: answer.questionId,
        questionText: answer.question.text,
        questionType: answer.question.type,
        response: answer.response,
        isCorrect: answer.isCorrect,
        pointsAwarded: answer.pointsAwarded,
        maxPoints: answer.question.points,
        explanation: answer.question.explanation
      }))

      responseData.answerBreakdown = answerBreakdown
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error submitting exam:', error)
    return NextResponse.json(
      { error: 'Failed to submit exam' },
      { status: 500 }
    )
  }
}
