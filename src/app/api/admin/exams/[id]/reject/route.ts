import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    const examId = id

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        school: {
          select: {
            name: true
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ message: 'Exam not found' }, { status: 404 })
    }

    // Create notification to the school about rejection
    await prisma.notification.create({
      data: {
        title: 'Exam Rejected',
        message: `Your exam "${exam.title}" has been rejected. Reason: ${reason || 'No reason provided'}`,
        type: 'SYSTEM_ALERT',
        userId: session.user.id,
        metadata: {
          examId: examId,
          schoolId: exam.schoolId,
          action: 'REJECTED',
          reason: reason || 'No reason provided'
        }
      }
    })

    return NextResponse.json({
      message: 'Exam rejected successfully',
      examId: examId
    })
  } catch (error) {
    console.error('Error rejecting exam:', error)
    return NextResponse.json(
      { message: 'Failed to reject exam' },
      { status: 500 }
    )
  }
}
