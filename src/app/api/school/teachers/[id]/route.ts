import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTeacherSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.coerce.number().int().min(0).max(50).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED', 'ON_LEAVE']).optional(),
})

// GET single teacher
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

    const teacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true
          }
        },
        classes: {
          select: {
            id: true,
            name: true,
            section: true,
            academicYear: true
          }
        },
        _count: {
          select: {
            classes: true
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 })
    }

    const transformedTeacher = {
      id: teacher.id,
      employeeId: teacher.employeeId,
      name: teacher.user.name,
      email: teacher.user.email,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      experience: teacher.experience,
      phone: teacher.phone,
      address: teacher.address,
      status: teacher.status,
      hireDate: teacher.hireDate?.toISOString(),
      lastLogin: teacher.lastLogin?.toISOString(),
      avatar: teacher.avatar,
      classCount: teacher._count.classes,
      classes: teacher.classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        academicYear: cls.academicYear,
        displayName: `${cls.name}${cls.section ? ` - ${cls.section}` : ''} (${cls.academicYear})`
      })),
      createdAt: teacher.user.createdAt.toISOString(),
      updatedAt: teacher.user.updatedAt.toISOString()
    }

    return NextResponse.json(transformedTeacher)
  } catch (error) {
    console.error('Error fetching teacher:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update teacher
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
    const validatedData = updateTeacherSchema.parse(body)

    // Check if teacher exists and belongs to the school
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId
      },
      include: {
        user: true
      }
    })

    if (!existingTeacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 })
    }

    // Check for email conflicts if email is being updated
    if (validatedData.email && validatedData.email !== existingTeacher.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: existingTeacher.userId }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Update teacher and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user fields if provided
      if (validatedData.name || validatedData.email) {
        await tx.user.update({
          where: { id: existingTeacher.userId },
          data: {
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.email && { email: validatedData.email }),
          }
        })
      }

      // Update teacher fields
      const updatedTeacher = await tx.teacher.update({
        where: { id },
        data: {
          ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
          ...(validatedData.address !== undefined && { address: validatedData.address }),
          ...(validatedData.qualification !== undefined && { qualification: validatedData.qualification }),
          ...(validatedData.specialization !== undefined && { specialization: validatedData.specialization }),
          ...(validatedData.experience !== undefined && { experience: validatedData.experience }),
          ...(validatedData.status && { status: validatedData.status }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              updatedAt: true
            }
          },
          classes: {
            select: {
              id: true,
              name: true,
              section: true,
              academicYear: true
            }
          },
          _count: {
            select: {
              classes: true
            }
          }
        }
      })

      return updatedTeacher
    })

    const transformedTeacher = {
      id: result.id,
      employeeId: result.employeeId,
      name: result.user.name,
      email: result.user.email,
      qualification: result.qualification,
      specialization: result.specialization,
      experience: result.experience,
      phone: result.phone,
      address: result.address,
      status: result.status,
      hireDate: result.hireDate?.toISOString(),
      lastLogin: result.lastLogin?.toISOString(),
      avatar: result.avatar,
      classCount: result._count.classes,
      classes: result.classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        academicYear: cls.academicYear,
        displayName: `${cls.name}${cls.section ? ` - ${cls.section}` : ''} (${cls.academicYear})`
      })),
      createdAt: result.user.createdAt.toISOString(),
      updatedAt: result.user.updatedAt.toISOString()
    }

    return NextResponse.json(transformedTeacher)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating teacher:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE teacher
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

    // Check if teacher exists and belongs to the school
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId
      }
    })

    if (!existingTeacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 })
    }

    // Delete teacher and associated user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete teacher first (due to foreign key constraints)
      await tx.teacher.delete({
        where: { id }
      })

      // Delete associated user
      await tx.user.delete({
        where: { id: existingTeacher.userId }
      })
    })

    return NextResponse.json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
