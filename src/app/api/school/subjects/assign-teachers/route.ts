import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignTeachersSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  teacherIds: z.array(z.string()).min(1, 'At least one teacher must be selected')
})

const removeTeacherSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assignTeachersSchema.parse(body)

    // Verify subject belongs to school
    const subject = await prisma.subject.findFirst({
      where: {
        id: validatedData.subjectId,
        schoolId: session.user.schoolId
      }
    })

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 })
    }

    // Verify all teachers belong to school
    const teachers = await prisma.teacher.findMany({
      where: {
        id: { in: validatedData.teacherIds },
        schoolId: session.user.schoolId
      }
    })

    if (teachers.length !== validatedData.teacherIds.length) {
      return NextResponse.json({ message: 'One or more teachers not found' }, { status: 404 })
    }

    // Get existing assignments
    const existingAssignments = await prisma.teacherSubject.findMany({
      where: {
        subjectId: validatedData.subjectId,
        teacherId: { in: validatedData.teacherIds }
      }
    })

    const existingTeacherIds = existingAssignments.map(a => a.teacherId)
    const newTeacherIds = validatedData.teacherIds.filter(id => !existingTeacherIds.includes(id))

    // Create new assignments
    const assignments = await Promise.all(
      newTeacherIds.map(teacherId =>
        prisma.teacherSubject.create({
          data: {
            teacherId,
            subjectId: validatedData.subjectId
          },
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        })
      )
    )

    return NextResponse.json({
      message: `Successfully assigned ${newTeacherIds.length} teachers to subject`,
      assignments,
      skipped: existingTeacherIds.length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error assigning teachers to subject:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = removeTeacherSchema.parse(body)

    // Verify subject belongs to school
    const subject = await prisma.subject.findFirst({
      where: {
        id: validatedData.subjectId,
        schoolId: session.user.schoolId
      }
    })

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 })
    }

    // Verify teacher belongs to school
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: validatedData.teacherId,
        schoolId: session.user.schoolId
      }
    })

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 })
    }

    // Check if assignment exists
    const assignment = await prisma.teacherSubject.findFirst({
      where: {
        teacherId: validatedData.teacherId,
        subjectId: validatedData.subjectId
      }
    })

    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })
    }

    // Remove assignment
    await prisma.teacherSubject.delete({
      where: {
        id: assignment.id
      }
    })

    return NextResponse.json({ message: 'Teacher removed from subject successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error removing teacher from subject:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get all teacher-subject assignments for this school
    const rawAssignments = await prisma.teacherSubject.findMany({
      where: {
        subject: {
          schoolId: session.user.schoolId
        }
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { subject: { name: 'asc' } },
        { teacher: { user: { name: 'asc' } } }
      ],
      skip: offset,
      take: limit
    })

    // Transform to match the flattened teacher structure
    const assignments = rawAssignments.map(assignment => ({
      id: assignment.id,
      teacher: {
        id: assignment.teacher.id,
        name: assignment.teacher.user.name,
        email: assignment.teacher.user.email,
        employeeId: assignment.teacher.employeeId
      },
      subject: assignment.subject,
      createdAt: assignment.createdAt
    }))

    // Get total count
    const totalCount = await prisma.teacherSubject.count({
      where: {
        subject: {
          schoolId: session.user.schoolId
        }
      }
    })

    return NextResponse.json({
      assignments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching teacher-subject assignments:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
