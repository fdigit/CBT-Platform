import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { school: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Get all classes in the teacher's school
    const classes = await prisma.class.findMany({
      where: {
        schoolId: teacher.schoolId,
        status: 'ACTIVE'
      },
      orderBy: [
        { name: 'asc' },
        { section: 'asc' }
      ]
    })

    return NextResponse.json({ 
      classes: classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        academicYear: cls.academicYear,
        description: cls.description,
        maxStudents: cls.maxStudents,
        room: cls.room
      }))
    })

  } catch (error) {
    console.error('Error fetching school classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

