import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const bulkTeacherSchema = z.object({
  teachers: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    experience: z.number().int().min(0).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    hireDate: z.string().optional(),
  }))
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bulkTeacherSchema.parse(body)

    const schoolId = session.user.schoolId!
    const importedTeachers = []
    const errors = []

    for (let i = 0; i < validatedData.teachers.length; i++) {
      const teacherData = validatedData.teachers[i]
      
      try {
        // Check if email or employeeId already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: teacherData.email }
        })

        if (existingUser) {
          errors.push(`Row ${i + 1}: Email ${teacherData.email} already exists`)
          continue
        }

        const existingTeacher = await prisma.teacher.findFirst({
          where: { 
            employeeId: teacherData.employeeId,
            schoolId: schoolId  // Scope to current school
          }
        })

        if (existingTeacher) {
          errors.push(`Row ${i + 1}: Employee ID ${teacherData.employeeId} already exists`)
          continue
        }

        // Generate password
        const password = `teacher${Math.random().toString(36).slice(-6)}`
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user and teacher in a transaction
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              name: teacherData.name,
              email: teacherData.email,
              password: hashedPassword,
              role: 'TEACHER',
              schoolId: schoolId
            }
          })

          const teacher = await tx.teacher.create({
            data: {
              userId: user.id,
              schoolId: schoolId,
              employeeId: teacherData.employeeId,
              qualification: teacherData.qualification,
              specialization: teacherData.specialization,
              experience: teacherData.experience || 0,
              phone: teacherData.phone,
              address: teacherData.address,
              hireDate: teacherData.hireDate ? new Date(teacherData.hireDate) : new Date(),
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

        // Transform to match the Teacher interface
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
          tempPassword: password
        }

        importedTeachers.push(transformedTeacher)
      } catch (error) {
        console.error(`Error importing teacher at row ${i + 1}:`, error)
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      teachers: importedTeachers,
      imported: importedTeachers.length,
      total: validatedData.teachers.length,
      errors
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error bulk importing teachers:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
