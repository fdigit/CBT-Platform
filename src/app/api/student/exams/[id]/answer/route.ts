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
    const { questionId, response, attemptId } = body

    if (!questionId || !attemptId) {
      return NextResponse.json({ 
        error: 'Question ID and attempt ID are required' 
      }, { status: 400 })
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Verify the attempt belongs to the student and is active
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
        error: 'Invalid or inactive exam attempt' 
      }, { status: 400 })
    }

    // Verify the question belongs to the exam
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        examId
      }
    })

    if (!question) {
      return NextResponse.json({ 
        error: 'Question not found in this exam' 
      }, { status: 400 })
    }

    // Check if exam time has expired
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const now = new Date()
    if (now > new Date(exam.endTime)) {
      return NextResponse.json({ 
        error: 'Exam time has expired' 
      }, { status: 400 })
    }

    // Auto-grade the answer for objective questions
    let isCorrect = null
    let pointsAwarded = 0

    if (['MCQ', 'TRUE_FALSE'].includes(question.type) && response) {
      const correctAnswer = question.correctAnswer
      if (correctAnswer && typeof correctAnswer === 'object' && 'answer' in correctAnswer) {
        isCorrect = response === (correctAnswer as any).answer
      } else if (typeof correctAnswer === 'string') {
        isCorrect = response === correctAnswer
      }

      if (isCorrect) {
        pointsAwarded = question.points
      } else if (exam.negativeMarking) {
        pointsAwarded = -question.points * 0.25 // 25% negative marking
      }
    }

    // Upsert the answer (update if exists, create if not)
    const answer = await prisma.answer.upsert({
      where: {
        studentId_questionId_examId: {
          studentId: student.id,
          questionId,
          examId
        }
      },
      update: {
        response,
        isCorrect,
        pointsAwarded,
        updatedAt: now,
        attemptId
      },
      create: {
        studentId: student.id,
        questionId,
        examId,
        attemptId,
        response,
        isCorrect,
        pointsAwarded
      }
    })

    return NextResponse.json({
      message: 'Answer saved successfully',
      answer: {
        id: answer.id,
        questionId: answer.questionId,
        response: answer.response,
        isCorrect: answer.isCorrect,
        pointsAwarded: answer.pointsAwarded
      }
    })

  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    )
  }
}
