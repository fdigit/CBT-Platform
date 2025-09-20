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
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Verify exam belongs to teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        teacherId: teacher.id
      },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true, section: true } }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 })
    }

    // Get all answers that need grading (subjective questions without grades)
    const answersToGrade = await prisma.answer.findMany({
      where: {
        examId,
        question: {
          type: {
            in: ['ESSAY', 'SHORT_ANSWER']
          }
        },
        isCorrect: null // Not yet graded
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } }
          }
        },
        question: {
          select: {
            id: true,
            text: true,
            type: true,
            points: true,
            correctAnswer: true
          }
        }
      },
      orderBy: [
        { student: { user: { name: 'asc' } } },
        { question: { order: 'asc' } }
      ]
    })

    // Get grading statistics
    const totalSubjectiveAnswers = await prisma.answer.count({
      where: {
        examId,
        question: {
          type: {
            in: ['ESSAY', 'SHORT_ANSWER']
          }
        }
      }
    })

    const gradedAnswers = await prisma.answer.count({
      where: {
        examId,
        question: {
          type: {
            in: ['ESSAY', 'SHORT_ANSWER']
          }
        },
        isCorrect: { not: null }
      }
    })

    const pendingGrading = totalSubjectiveAnswers - gradedAnswers

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject?.name,
        class: exam.class ? `${exam.class.name} ${exam.class.section || ''}` : 'All Classes'
      },
      statistics: {
        totalSubjectiveAnswers,
        gradedAnswers,
        pendingGrading
      },
      answersToGrade: answersToGrade.map(answer => ({
        id: answer.id,
        studentId: answer.studentId,
        studentName: answer.student.user.name,
        questionId: answer.questionId,
        questionText: answer.question.text,
        questionType: answer.question.type,
        maxPoints: answer.question.points,
        response: answer.response,
        sampleAnswer: answer.question.correctAnswer,
        submittedAt: answer.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching answers to grade:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: examId } = await params
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { answerId, pointsAwarded, feedback } = body

    if (!answerId || pointsAwarded === undefined) {
      return NextResponse.json(
        { error: 'Answer ID and points awarded are required' },
        { status: 400 }
      )
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Verify the answer belongs to teacher's exam
    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        exam: {
          teacherId: teacher.id
        }
      },
      include: {
        question: true,
        student: true,
        exam: true
      }
    })

    if (!answer) {
      return NextResponse.json({ error: 'Answer not found or access denied' }, { status: 404 })
    }

    // Validate points awarded
    if (pointsAwarded < 0 || pointsAwarded > answer.question.points) {
      return NextResponse.json(
        { error: `Points must be between 0 and ${answer.question.points}` },
        { status: 400 }
      )
    }

    // Update the answer with grade
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: parseFloat(pointsAwarded),
        isCorrect: pointsAwarded > 0, // Consider any points as partially correct
        updatedAt: new Date()
      }
    })

    // Recalculate student's total score for this exam
    const allAnswers = await prisma.answer.findMany({
      where: {
        examId,
        studentId: answer.studentId
      }
    })

    const totalScore = allAnswers.reduce((sum, ans) => sum + (ans.pointsAwarded || 0), 0)

    // Update the result
    await prisma.result.upsert({
      where: {
        studentId_examId: {
          studentId: answer.studentId,
          examId
        }
      },
      update: {
        score: totalScore,
        gradedAt: new Date()
      },
      create: {
        studentId: answer.studentId,
        examId,
        score: totalScore
      }
    })

    return NextResponse.json({
      message: 'Answer graded successfully',
      answer: updatedAnswer,
      totalScore
    })

  } catch (error) {
    console.error('Error grading answer:', error)
    return NextResponse.json(
      { error: 'Failed to grade answer' },
      { status: 500 }
    )
  }
}
