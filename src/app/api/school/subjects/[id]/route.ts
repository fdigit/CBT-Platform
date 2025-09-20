import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const subject = await prisma.subject.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId
      },
      include: {
        teachers: {
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
            }
          }
        },
        classSubjects: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                academicYear: true
              }
            },
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
            }
          }
        },
        _count: {
          select: {
            teachers: true,
            classSubjects: true
          }
        }
      }
    })

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 })
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error('Error fetching subject:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateSubjectSchema.parse(body)

    // Check if subject exists and belongs to school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId
      }
    })

    if (!existingSubject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 })
    }

    // Check for name/code conflicts if they're being updated
    if (validatedData.name || validatedData.code) {
      const conflictWhere: any = {
        schoolId: session.user.schoolId,
        id: { not: id }
      }

      const orConditions = []
      if (validatedData.name) {
        orConditions.push({ name: validatedData.name })
      }
      if (validatedData.code) {
        orConditions.push({ code: validatedData.code })
      }

      if (orConditions.length > 0) {
        conflictWhere.OR = orConditions

        const conflictingSubject = await prisma.subject.findFirst({
          where: conflictWhere
        })

        if (conflictingSubject) {
          return NextResponse.json(
            { message: 'Subject with this name or code already exists' },
            { status: 400 }
          )
        }
      }
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            teachers: true,
            classSubjects: true
          }
        }
      }
    })

    return NextResponse.json(subject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating subject:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if subject exists and belongs to school
    const subject = await prisma.subject.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId
      },
      include: {
        _count: {
          select: {
            teachers: true,
            classSubjects: true
          }
        }
      }
    })

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 })
    }

    // Check if subject has assignments
    if (subject._count.teachers > 0 || subject._count.classSubjects > 0) {
      return NextResponse.json(
        { message: 'Cannot delete subject with existing teacher or class assignments' },
        { status: 400 }
      )
    }

    await prisma.subject.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Subject deleted successfully' })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
