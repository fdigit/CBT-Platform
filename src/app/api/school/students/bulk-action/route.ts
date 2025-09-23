import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['activate', 'suspend', 'graduate', 'delete', 'promote']),
  studentIds: z.array(z.string()),
  data: z.object({
    newClass: z.string().optional(),
    newSection: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, studentIds, data } = bulkActionSchema.parse(body)

    // Verify all students belong to the school
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        schoolId: session.user.schoolId
      }
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { message: 'Some students not found or do not belong to your school' },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case 'activate':
        result = await prisma.student.updateMany({
          where: { id: { in: studentIds } },
          data: { status: 'ACTIVE' }
        })
        break

      case 'suspend':
        result = await prisma.student.updateMany({
          where: { id: { in: studentIds } },
          data: { status: 'SUSPENDED' }
        })
        break

      case 'graduate':
        result = await prisma.student.updateMany({
          where: { id: { in: studentIds } },
          data: { status: 'GRADUATED' }
        })
        break

      case 'promote':
        if (!data?.newClass) {
          return NextResponse.json(
            { message: 'New class is required for promotion' },
            { status: 400 }
          )
        }
        result = await prisma.student.updateMany({
          where: { id: { in: studentIds } },
          data: {
            classId: data.newClass
          }
        })
        break

      case 'delete':
        // First delete related records
        await prisma.$transaction([
          prisma.answer.deleteMany({
            where: { studentId: { in: studentIds } }
          }),
          prisma.result.deleteMany({
            where: { studentId: { in: studentIds } }
          }),
          prisma.student.deleteMany({
            where: { id: { in: studentIds } }
          }),
          prisma.user.deleteMany({
            where: { 
              StudentProfile: { 
                id: { in: studentIds } 
              }
            }
          })
        ])
        result = { count: studentIds.length }
        break

      default:
        return NextResponse.json(
          { message: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: `Successfully ${action}d ${result.count} students`,
      count: result.count
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
