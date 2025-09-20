import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { examSchema, questionSchema } from '@/lib/validations'
import { Role } from '@/types/models'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    if (![Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { exam, questions } = body

    const schoolId = session.user.schoolId
    if (!schoolId && session.user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 })
    }

    // Validate exam data
    const validatedExam = examSchema.parse(exam)

    // Validate questions
    const validatedQuestions = questions.map((q: any) => questionSchema.parse(q))

    // Create exam and questions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create exam
      const newExam = await tx.exam.create({
        data: {
          title: validatedExam.title,
          description: validatedExam.description,
          startTime: new Date(validatedExam.startTime),
          endTime: new Date(validatedExam.endTime),
          duration: validatedExam.duration,
          shuffle: validatedExam.shuffle,
          negativeMarking: validatedExam.negativeMarking,
          schoolId: schoolId!,
        }
      })

      // Create questions
      const createdQuestions = await Promise.all(
        validatedQuestions.map((question: any) =>
          tx.question.create({
            data: {
              text: question.text,
              type: question.type,
              options: question.options || null,
              correctAnswer: question.correctAnswer || null,
              points: question.points,
              examId: newExam.id,
            }
          })
        )
      )

      return { exam: newExam, questions: createdQuestions }
    })

    return NextResponse.json({
      message: 'Exam created successfully',
      exam: result.exam,
      questionsCount: result.questions.length
    })
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      { message: 'Failed to create exam' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    if (![Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 })
    }

    // Build where clause based on user role
    let whereClause: any = {}
    
    if (session.user.role === Role.SCHOOL_ADMIN) {
      whereClause.schoolId = session.user.schoolId
    }
    // Super admins see all exams (no additional where clause needed)
    
    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            points: true
          }
        },
        _count: {
          select: {
            results: true,
            answers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(exams)
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

