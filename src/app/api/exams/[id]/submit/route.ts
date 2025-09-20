import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateScore } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { answers } = body

    const studentId = session.user.studentProfile?.id
    if (!studentId) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 })
    }

    // Get exam with questions
    const exam = await prisma.exam.findFirst({
      where: {
        id: id,
        schoolId: session.user.schoolId
      },
      include: {
        questions: true
      }
    })

    if (!exam) {
      return NextResponse.json({ message: 'Exam not found' }, { status: 404 })
    }

    // Check if exam is still active
    const now = new Date()
    if (now > exam.endTime) {
      return NextResponse.json({ message: 'Exam has ended' }, { status: 400 })
    }

    // Check if student has already submitted
    const existingResult = await prisma.result.findFirst({
      where: {
        studentId,
        examId: id
      }
    })

    if (existingResult) {
      return NextResponse.json({ message: 'Exam already submitted' }, { status: 400 })
    }

    // Save answers and calculate score
    const result = await prisma.$transaction(async (tx) => {
      // Save all answers
      const answerPromises = Object.entries(answers).map(([questionId, response]) =>
        tx.answer.create({
          data: {
            studentId,
            questionId,
            examId: id,
            response: response as any
          }
        })
      )

      await Promise.all(answerPromises)

      // Calculate score
      const savedAnswers = await tx.answer.findMany({
        where: {
          studentId,
          examId: id
        }
      })

      const { score, totalPoints } = calculateScore(savedAnswers, exam.questions)

      // Create result record
      const result = await tx.result.create({
        data: {
          studentId,
          examId: id,
          score
        }
      })

      return { result, score, totalPoints }
    })

    return NextResponse.json({
      message: 'Exam submitted successfully',
      score: result.score,
      totalPoints: result.totalPoints,
      percentage: Math.round((result.score / result.totalPoints) * 100)
    })
  } catch (error) {
    console.error('Error submitting exam:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
