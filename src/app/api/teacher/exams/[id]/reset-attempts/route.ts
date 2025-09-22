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
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Verify the exam belongs to the teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        teacherId: teacher.id,
        schoolId: teacher.schoolId
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 })
    }

    const body = await request.json()
    const { studentId, resetAll } = body

    if (resetAll) {
      // Reset all student attempts for this exam
      await prisma.$transaction(async (tx) => {
        // Delete all attempts
        await tx.examAttempt.deleteMany({
          where: { examId }
        })

        // Delete all answers
        await tx.answer.deleteMany({
          where: { examId }
        })

        // Delete all results
        await tx.result.deleteMany({
          where: { examId }
        })
      })

      return NextResponse.json({
        message: 'All student attempts have been reset for this exam',
        resetCount: 'all'
      })
    } else if (studentId) {
      // Reset attempts for a specific student
      const resetCount = await prisma.$transaction(async (tx) => {
        // Delete student's attempts
        const attemptsDeleted = await tx.examAttempt.deleteMany({
          where: { 
            examId,
            studentId 
          }
        })

        // Delete student's answers
        await tx.answer.deleteMany({
          where: { 
            examId,
            studentId 
          }
        })

        // Delete student's results
        await tx.result.deleteMany({
          where: { 
            examId,
            studentId 
          }
        })

        return attemptsDeleted.count
      })

      return NextResponse.json({
        message: `Student attempts have been reset (${resetCount} attempts deleted)`,
        resetCount
      })
    } else {
      return NextResponse.json({ 
        error: 'Either studentId or resetAll must be provided' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error resetting exam attempts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
