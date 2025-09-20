import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schoolRegistrationSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ schools })
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate unique slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

async function generateUniqueSlug(name: string): Promise<string> {
  let baseSlug = generateSlug(name)
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existingSchool = await prisma.school.findUnique({
      where: { slug }
    })
    
    if (!existingSchool) {
      return slug
    }
    
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = schoolRegistrationSchema.parse(body)

    // Check if school email already exists
    const existingSchool = await prisma.school.findUnique({
      where: { email: validatedData.email }
    })

    if (existingSchool) {
      return NextResponse.json(
        { message: 'School with this email already exists' },
        { status: 400 }
      )
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.adminEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Admin with this email already exists' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(validatedData.name)

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.adminPassword, 12)

    // Create school and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create school - Super admin can directly approve
      const school = await tx.school.create({
        data: {
          name: validatedData.name,
          slug,
          email: validatedData.email,
          phone: validatedData.phone,
          status: 'APPROVED', // Super admin directly approves
        }
      })

      // Create admin user
      const user = await tx.user.create({
        data: {
          email: validatedData.adminEmail,
          password: hashedPassword,
          name: validatedData.adminName,
          role: 'SCHOOL_ADMIN',
          schoolId: school.id,
        }
      })

      // Create school admin profile
      await tx.schoolAdmin.create({
        data: {
          userId: user.id,
          schoolId: school.id,
        }
      })

      return { school, user }
    })

    return NextResponse.json(
      { 
        message: 'School created successfully',
        school: {
          id: result.school.id,
          name: result.school.name,
          email: result.school.email,
          slug: result.school.slug,
          status: result.school.status
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('School creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
