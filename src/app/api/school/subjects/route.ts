import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().optional(),
  description: z.string().optional()
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
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        _count: {
          select: {
            teachers: true,
            classSubjects: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.subject.count({ where })

    return NextResponse.json({
      subjects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('POST /api/school/subjects - Session:', { 
      userId: session?.user?.id, 
      role: session?.user?.role, 
      schoolId: session?.user?.schoolId 
    })
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const validatedData = createSubjectSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Check if subject already exists for this school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        schoolId: session.user.schoolId,
        OR: [
          { name: validatedData.name },
          ...(validatedData.code ? [{ code: validatedData.code }] : [])
        ]
      }
    })

    if (existingSubject) {
      return NextResponse.json(
        { message: 'Subject with this name or code already exists' },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        ...validatedData,
        schoolId: session.user.schoolId!
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

    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating subject:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
