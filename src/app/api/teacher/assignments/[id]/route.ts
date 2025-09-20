import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
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

    // Get assignment with full details
    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        teacherId: teacher.id
      },
      include: {
        subject: {
          select: { name: true, code: true }
        },
        class: {
          select: { name: true, section: true }
        },
        attachments: true,
        submissions: {
          include: {
            student: {
              select: { 
                id: true, 
                regNumber: true,
                user: { select: { name: true, email: true } }
              }
            },
            attachments: true
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ assignment })

  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
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

    const body = await request.json()
    const {
      title,
      description,
      instructions,
      type,
      dueDate,
      maxScore,
      status,
      classId,
      subjectId
    } = body

    // Update assignment
    const assignment = await prisma.assignment.updateMany({
      where: {
        id,
        teacherId: teacher.id
      },
      data: {
        title,
        description,
        instructions,
        type,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore,
        status,
        classId: classId || null,
        subjectId: subjectId || null,
        updatedAt: new Date()
      }
    })

    if (assignment.count === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get updated assignment
    const updatedAssignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        subject: {
          select: { name: true, code: true }
        },
        class: {
          select: { name: true, section: true }
        },
        attachments: true
      }
    })

    return NextResponse.json({ assignment: updatedAssignment })

  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
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

    // Delete assignment (cascade will handle related records)
    const result = await prisma.assignment.deleteMany({
      where: {
        id,
        teacherId: teacher.id
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' })

  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}

