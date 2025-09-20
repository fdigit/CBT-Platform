import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: { 
        school: true,
        class: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const subject = searchParams.get('subject')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where clause - only show assignments for student's class or general assignments
    const where: any = {
      schoolId: student.schoolId,
      status: 'PUBLISHED', // Only show published assignments
      OR: [
        { classId: student.classId }, // Assignments for student's class
        { classId: null }, // General assignments for all classes
      ]
    }

    console.log(`Student ${student.id} (Class: ${student.classId}) fetching assignments with filter:`, JSON.stringify(where, null, 2))

    if (type && type !== 'all') {
      where.type = type
    }

    if (subject && subject !== 'all') {
      where.subject = {
        name: subject
      }
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }
      ]
    }

    // Get assignments with student's submissions
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        subject: {
          select: { name: true, code: true }
        },
        class: {
          select: { name: true, section: true }
        },
        teacher: {
          select: {
            user: {
              select: { name: true }
            }
          }
        },
        attachments: true,
        submissions: {
          where: {
            studentId: student.id
          },
          include: {
            attachments: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Filter by submission status if requested
    let filteredAssignments = assignments
    if (status && status !== 'all') {
      filteredAssignments = assignments.filter(assignment => {
        const hasSubmission = assignment.submissions.length > 0
        const submission = assignment.submissions[0]
        
        switch (status) {
          case 'pending':
            return !hasSubmission && ['ASSIGNMENT', 'HOMEWORK', 'PROJECT', 'QUIZ', 'TEST'].includes(assignment.type)
          case 'submitted':
            return hasSubmission && submission.status !== 'GRADED'
          case 'graded':
            return hasSubmission && submission.status === 'GRADED'
          default:
            return true
        }
      })
    }

    // Format response
    const formattedAssignments = filteredAssignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      type: assignment.type,
      dueDate: assignment.dueDate,
      createdAt: assignment.createdAt,
      maxScore: assignment.maxScore,
      subject: assignment.subject?.name || 'General',
      class: assignment.class ? `${assignment.class.name}${assignment.class.section ? ` ${assignment.class.section}` : ''}` : 'All Classes',
      teacherName: assignment.teacher.user.name,
      attachments: assignment.attachments.map(att => ({
        id: att.id,
        name: att.originalName,
        url: `/api/attachments/${att.fileName}`, // TODO: Implement file serving
        size: `${Math.round(att.fileSize / 1024)} KB`
      })),
      submission: assignment.submissions.length > 0 ? {
        id: assignment.submissions[0].id,
        status: assignment.submissions[0].status,
        submittedAt: assignment.submissions[0].submittedAt,
        score: assignment.submissions[0].score,
        feedback: assignment.submissions[0].feedback,
        attachments: assignment.submissions[0].attachments.map(att => ({
          id: att.id,
          name: att.originalName,
          url: `/api/attachments/${att.fileName}`
        }))
      } : null
    }))

    console.log(`Returning ${formattedAssignments.length} assignments for student ${student.id}`)
    
    return NextResponse.json({ assignments: formattedAssignments })

  } catch (error) {
    console.error('Error fetching student assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
