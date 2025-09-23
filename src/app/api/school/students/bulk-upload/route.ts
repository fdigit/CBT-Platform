import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const bulkStudentSchema = z.object({
  students: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    regNumber: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    class: z.string().optional(),
    section: z.string().optional(),
    parentPhone: z.string().optional(),
    parentEmail: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
  }))
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { students } = bulkStudentSchema.parse(body)

    const results = {
      success: true,
      data: [] as any[],
      errors: [] as string[],
      duplicates: [] as string[]
    }

    // Process each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      
      try {
        // Generate reg number if not provided
        const regNumber = student.regNumber || `STU${new Date().getFullYear()}${String(i + 1).padStart(4, '0')}`
        
        // Generate password
        const password = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(password, 10)

        // Check for existing email
        const existingUser = await prisma.user.findUnique({
          where: { email: student.email }
        })

        if (existingUser) {
          results.duplicates.push(`${student.name} (${student.email})`)
          continue
        }

        // Check for existing reg number
        const existingStudent = await prisma.student.findUnique({
          where: { regNumber }
        })

        if (existingStudent) {
          results.duplicates.push(`${student.name} (${regNumber})`)
          continue
        }

        // Create user and student in transaction
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              name: student.name,
              email: student.email,
              password: hashedPassword,
              role: 'STUDENT',
              schoolId: session.user.schoolId
            }
          })

          const newStudent = await tx.student.create({
            data: {
              userId: user.id,
              schoolId: session.user.schoolId!,
              regNumber,
              gender: student.gender,
              classId: student.class,
              parentPhone: student.parentPhone,
              parentEmail: student.parentEmail || undefined,
              dateOfBirth: student.dateOfBirth,
              address: student.address,
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
              },
              class: {
                select: {
                  id: true,
                  name: true,
                  section: true,
                  academicYear: true
                }
              }
            }
          })

          return { user, student: newStudent, password }
        })

        // Transform for response
        const transformedStudent = {
          id: result.student.id,
          regNumber: result.student.regNumber,
          name: result.student.user.name,
          email: result.student.user.email,
          gender: result.student.gender,
          class: result.student.class,
          parentPhone: result.student.parentPhone,
          parentEmail: result.student.parentEmail,
          dateOfBirth: result.student.dateOfBirth,
          address: result.student.address,
          status: result.student.status,
          avatar: result.student.avatar,
          lastLogin: result.student.lastLogin,
          lastExamTaken: result.student.lastExamTaken,
          performanceScore: null,
          totalExams: 0,
          createdAt: result.student.user.createdAt.toISOString(),
          updatedAt: result.student.user.updatedAt.toISOString(),
          tempPassword: result.password // Include generated password
        }

        results.data.push(transformedStudent)

      } catch (error) {
        console.error(`Error creating student ${student.name}:`, error)
        results.errors.push(`${student.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // If no students were created successfully, mark as failed
    if (results.data.length === 0 && results.errors.length > 0) {
      results.success = false
    }

    return NextResponse.json(results, { status: results.success ? 201 : 400 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error in bulk upload:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
