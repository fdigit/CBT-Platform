import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  description: z.string().optional(),
  maxStudents: z.number().int().positive().default(40),
  room: z.string().optional(),
  teacherIds: z.array(z.string()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const academicYear = searchParams.get('academicYear') || ''
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
        { name: { contains: search, mode: 'insensitive' } },
        { section: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (academicYear) {
      where.academicYear = academicYear
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        teachers: {
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
        _count: {
          select: {
            students: true,
            exams: true
          }
        }
      },
      orderBy: [
        { academicYear: 'desc' },
        { name: 'asc' },
        { section: 'asc' }
      ],
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.class.count({ where })

    // Transform data
    const transformedClasses = classes.map(classItem => ({
      id: classItem.id,
      name: classItem.name,
      section: classItem.section,
      academicYear: classItem.academicYear,
      description: classItem.description,
      maxStudents: classItem.maxStudents,
      room: classItem.room,
      status: classItem.status,
      studentCount: classItem._count.students,
      examCount: classItem._count.exams,
      teachers: classItem.teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email,
        employeeId: teacher.employeeId
      })),
      createdAt: classItem.createdAt.toISOString(),
      updatedAt: classItem.updatedAt.toISOString()
    }))

    return NextResponse.json({
      classes: transformedClasses,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    })
  } catch (error) {
    console.error('Error fetching classes:', error)
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
    const validatedData = createClassSchema.parse(body)

    // Check if class with same name, section, and academic year already exists
    const existingClass = await prisma.class.findFirst({
      where: {
        schoolId: session.user.schoolId,
        name: validatedData.name,
        section: validatedData.section || null,
        academicYear: validatedData.academicYear
      }
    })

    if (existingClass) {
      return NextResponse.json(
        { message: 'Class with this name, section, and academic year already exists' },
        { status: 400 }
      )
    }

    // Verify teachers exist and belong to the school if provided
    if (validatedData.teacherIds && validatedData.teacherIds.length > 0) {
      const teachers = await prisma.teacher.findMany({
        where: {
          id: { in: validatedData.teacherIds },
          schoolId: session.user.schoolId
        }
      })

      if (teachers.length !== validatedData.teacherIds.length) {
        return NextResponse.json(
          { message: 'Some teachers not found or do not belong to your school' },
          { status: 400 }
        )
      }
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        schoolId: session.user.schoolId!,
        name: validatedData.name,
        section: validatedData.section,
        academicYear: validatedData.academicYear,
        description: validatedData.description,
        maxStudents: validatedData.maxStudents,
        room: validatedData.room,
        status: 'ACTIVE',
        ...(validatedData.teacherIds && {
          teachers: {
            connect: validatedData.teacherIds.map(id => ({ id }))
          }
        })
      },
      include: {
        teachers: {
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
        _count: {
          select: {
            students: true,
            exams: true
          }
        }
      }
    })

    const transformedClass = {
      id: newClass.id,
      name: newClass.name,
      section: newClass.section,
      academicYear: newClass.academicYear,
      description: newClass.description,
      maxStudents: newClass.maxStudents,
      room: newClass.room,
      status: newClass.status,
      studentCount: newClass._count.students,
      examCount: newClass._count.exams,
      teachers: newClass.teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email,
        employeeId: teacher.employeeId
      })),
      createdAt: newClass.createdAt.toISOString(),
      updatedAt: newClass.updatedAt.toISOString()
    }

    return NextResponse.json(transformedClass, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating class:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
