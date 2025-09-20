import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Verify teacher belongs to school
    const teacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId
      }
    })

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 })
    }

    // Get teacher's assigned subjects
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacherId: id
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            status: true
          }
        }
      },
      orderBy: {
        subject: {
          name: 'asc'
        }
      }
    })

    const subjects = teacherSubjects.map(ts => ts.subject)

    return NextResponse.json(subjects)
  } catch (error) {
    console.error('Error fetching teacher subjects:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
