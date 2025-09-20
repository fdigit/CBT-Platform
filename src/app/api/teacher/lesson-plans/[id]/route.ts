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

    // Get lesson plan with full details
    const lessonPlan = await prisma.lessonPlan.findFirst({
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
        resources: true,
        reviewer: {
          select: { name: true }
        }
      }
    })

    if (!lessonPlan) {
      return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })
    }

    return NextResponse.json({ lessonPlan })

  } catch (error) {
    console.error('Error fetching lesson plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson plan' },
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
      topic,
      duration,
      objectives,
      materials,
      activities,
      assessment,
      homework,
      notes,
      scheduledDate,
      status,
      classId,
      subjectId
    } = body

    // Check if lesson plan exists and belongs to teacher
    const existingLessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        id,
        teacherId: teacher.id
      }
    })

    if (!existingLessonPlan) {
      return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })
    }

    // Check if lesson plan can be edited (not approved)
    if (existingLessonPlan.reviewStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot edit approved lesson plan' },
        { status: 400 }
      )
    }

    // Update lesson plan
    const lessonPlan = await prisma.lessonPlan.update({
      where: { id },
      data: {
        title,
        topic,
        duration,
        objectives,
        materials,
        activities,
        assessment,
        homework,
        notes,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status,
        classId: classId || null,
        subjectId: subjectId || null,
        updatedAt: new Date(),
        // Reset review status if content changed
        ...(status === 'PUBLISHED' && existingLessonPlan.reviewStatus !== 'PENDING' ? {
          reviewStatus: 'PENDING',
          reviewNotes: null,
          reviewedAt: null,
          reviewedBy: null
        } : {})
      },
      include: {
        subject: {
          select: { name: true, code: true }
        },
        class: {
          select: { name: true, section: true }
        },
        resources: true
      }
    })

    return NextResponse.json({ lessonPlan })

  } catch (error) {
    console.error('Error updating lesson plan:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson plan' },
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

    // Delete lesson plan (cascade will handle related records)
    const result = await prisma.lessonPlan.deleteMany({
      where: {
        id,
        teacherId: teacher.id
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Lesson plan deleted successfully' })

  } catch (error) {
    console.error('Error deleting lesson plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson plan' },
      { status: 500 }
    )
  }
}

