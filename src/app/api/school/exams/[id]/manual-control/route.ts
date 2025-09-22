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
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: examId } = await params
    const schoolId = session.user.schoolId

    if (!schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, enableManualControl } = body

    // Validate action
    if (!['make_live', 'make_completed', 'toggle_manual_control'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Check if exam exists and belongs to the school
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: schoolId
      },
      include: {
        attempts: {
          select: {
            id: true,
            status: true,
            studentId: true
          }
        }
      }
    })

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'make_live':
        // Check if any students have already started the exam
        const hasActiveAttempts = existingExam.attempts.some(attempt => 
          attempt.status === 'IN_PROGRESS' || attempt.status === 'SUBMITTED'
        )
        
        if (hasActiveAttempts) {
          return NextResponse.json({ 
            error: 'Cannot make exam live - students have already started taking this exam' 
          }, { status: 400 })
        }

        updateData = {
          isLive: true,
          isCompleted: false,
          manualControl: true
        }
        break

      case 'make_completed':
        updateData = {
          isCompleted: true,
          isLive: false,
          manualControl: true
        }
        break

      case 'toggle_manual_control':
        updateData = {
          manualControl: enableManualControl,
          // Reset manual status when disabling manual control
          ...(enableManualControl === false && {
            isLive: false,
            isCompleted: false
          })
        }
        break
    }

    // Update the exam
    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: updateData,
      include: {
        teacher: {
          include: {
            user: { select: { name: true } }
          }
        },
        subject: true,
        class: true
      }
    })

    return NextResponse.json({
      message: `Exam ${action.replace('_', ' ')}d successfully`,
      exam: updatedExam
    })

  } catch (error) {
    console.error('Error updating exam manual control:', error)
    return NextResponse.json(
      { error: 'Failed to update exam control' },
      { status: 500 }
    )
  }
}
