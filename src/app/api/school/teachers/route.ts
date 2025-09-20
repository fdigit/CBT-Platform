import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createTeacherSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  hireDate: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const teachers = await prisma.teacher.findMany({
      where,
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
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      },
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.teacher.count({ where })

    // Transform data
    const transformedTeachers = teachers.map(teacher => ({
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
    }))

    return NextResponse.json({
      teachers: transformedTeachers,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    })
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTeacherSchema.parse(body)

    // Check if email or employeeId already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      )
    }

    const existingTeacher = await prisma.teacher.findFirst({
      where: { 
        employeeId: validatedData.employeeId,
        schoolId: session.user.schoolId  // Scope to current school
      }
    })

    if (existingTeacher) {
      return NextResponse.json(
        { message: 'Employee ID already exists' },
        { status: 400 }
      )
    }

    // Generate password if not provided
    const password = validatedData.password || `teacher${Math.random().toString(36).slice(-6)}`
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and teacher in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: 'TEACHER',
          schoolId: session.user.schoolId
        }
      })

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          schoolId: session.user.schoolId!,
          employeeId: validatedData.employeeId,
          qualification: validatedData.qualification,
          specialization: validatedData.specialization,
          experience: validatedData.experience,
          phone: validatedData.phone,
          address: validatedData.address,
          hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : new Date(),
          status: 'ACTIVE'
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
          }
        }
      })

      return { user, teacher }
    })

    const transformedTeacher = {
      id: result.teacher.id,
      employeeId: result.teacher.employeeId,
      name: result.teacher.user.name,
      email: result.teacher.user.email,
      qualification: result.teacher.qualification,
      specialization: result.teacher.specialization,
      experience: result.teacher.experience,
      phone: result.teacher.phone,
      address: result.teacher.address,
      status: result.teacher.status,
      hireDate: result.teacher.hireDate?.toISOString(),
      lastLogin: result.teacher.lastLogin?.toISOString(),
      avatar: result.teacher.avatar,
      classCount: 0,
      classes: [],
      createdAt: result.teacher.user.createdAt.toISOString(),
      updatedAt: result.teacher.user.updatedAt.toISOString(),
      tempPassword: validatedData.password ? undefined : password // Return temp password if auto-generated
    }

    return NextResponse.json(transformedTeacher, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating teacher:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
