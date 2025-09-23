import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { school: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const subject = searchParams.get('subject')
    const classId = searchParams.get('classId')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {
      teacherId: teacher.id,
      schoolId: teacher.schoolId,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (subject && subject !== 'all') {
      where.subject = {
        name: subject
      }
    }

    if (classId && classId !== 'all') {
      where.classId = classId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get assignments with pagination
    const [assignments, totalCount] = await Promise.all([
      prisma.assignment.findMany({
        where,
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
                select: { id: true, user: { select: { name: true } } }
              },
              attachments: true
            }
          },
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.assignment.count({ where })
    ])

    // Calculate submission statistics for each assignment
    const assignmentsWithStats = assignments.map(assignment => {
      const submissions = assignment.submissions
      const totalStudents = assignment.class ? 30 : 0 // Mock - get actual count from class enrollment
      
      return {
        ...assignment,
        submissions: {
          total: totalStudents,
          submitted: submissions.length,
          graded: submissions.filter(s => s.status === 'GRADED').length,
          pending: submissions.filter(s => s.status === 'SUBMITTED').length,
        },
        averageScore: submissions.length > 0 
          ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length 
          : null,
        submissionDetails: submissions.map(s => ({
          id: s.id,
          studentId: s.studentId,
          studentName: s.student.user.name,
          status: s.status,
          submittedAt: s.submittedAt,
          score: s.score,
          feedback: s.feedback,
          attachments: s.attachments
        }))
      }
    })

    console.log(`Found ${assignmentsWithStats.length} assignments for teacher ${teacher.id}`)
    
    return NextResponse.json({
      assignments: assignmentsWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { school: true }
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
      subjectId,
      attachments = []
    } = body

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        instructions,
        type,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore || 100,
        status: status || 'DRAFT',
        schoolId: teacher.schoolId,
        teacherId: teacher.id,
        classId: (classId && classId !== 'all') ? classId : null,
        subjectId: (subjectId && subjectId !== 'general') ? subjectId : null,
        attachments: {
          create: attachments.map((attachment: any) => ({
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            filePath: attachment.filePath,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType
          }))
        }
      },
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

    return NextResponse.json({ assignment }, { status: 201 })

  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
