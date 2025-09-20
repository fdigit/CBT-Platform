import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const userQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT']).optional(),
  schoolId: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT']).optional(),
  schoolId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = userQuerySchema.parse(Object.fromEntries(searchParams))
    
    const page = parseInt(params.page)
    const limit = parseInt(params.limit)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    
    if (params.role) {
      where.role = params.role
    }
    
    if (params.schoolId) {
      where.schoolId = params.schoolId
    }
    
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom)
      }
      if (params.dateTo) {
        where.createdAt.lte = new Date(params.dateTo)
      }
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
              status: true,
            }
          },
          StudentProfile: {
            select: {
              regNumber: true,
            }
          },
          SchoolAdminProfile: {
            select: {
              id: true,
            }
          },
          _count: {
            select: {
              notifications: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    // Transform users data
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school ? {
        id: user.school.id,
        name: user.school.name,
        status: user.school.status,
      } : null,
      regNumber: user.StudentProfile?.regNumber,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      notificationCount: user._count.notifications,
    }))

    // Get summary statistics
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
    ])

    const [totalUsers, newUsersThisMonth, roleDistribution] = stats

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalUsers,
        newUsersThisMonth,
        roleDistribution: roleDistribution.reduce((acc, item) => {
          acc[item.role] = item._count.role
          return acc
        }, {} as Record<string, number>),
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if email already exists
    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { message: 'User with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Create user (this would typically require a password, but for now we'll create without)
    const user = await prisma.user.create({
      data: {
        name: validatedData.name || 'New User',
        email: validatedData.email || `user-${Date.now()}@example.com`,
        password: 'temp-password', // This should be properly handled
        role: validatedData.role || 'STUDENT',
        schoolId: validatedData.schoolId,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        },
        StudentProfile: {
          select: {
            regNumber: true,
          }
        },
      }
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      regNumber: user.StudentProfile?.regNumber,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
