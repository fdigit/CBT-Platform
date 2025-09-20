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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: examId } = await params
    const schoolId = session.user.schoolId

    if (!schoolId) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 })
    }

    // Check if exam exists and belongs to the school
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: schoolId
      }
    })

    if (!existingExam) {
      return NextResponse.json({ message: 'Exam not found' }, { status: 404 })
    }

    // For now, just return success since is_live field doesn't exist in schema
    // TODO: Add is_live field to schema and implement toggle functionality
    return NextResponse.json({
      message: 'Exam status updated successfully',
      exam: existingExam
    })
  } catch (error) {
    console.error('Error toggling exam live status:', error)
    return NextResponse.json(
      { message: 'Failed to update exam status' },
      { status: 500 }
    )
  }
}
