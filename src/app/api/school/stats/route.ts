import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const schoolId = session.user.schoolId
    if (!schoolId) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 })
    }

    const stats = await prisma.$transaction(async (tx) => {
      const students = await tx.student.count({
        where: { schoolId }
      })

      const exams = await tx.exam.count({
        where: { schoolId }
      })

      const activeExams = await tx.exam.count({
        where: {
          schoolId,
          startTime: { lte: new Date() },
          endTime: { gte: new Date() }
        }
      })

      const completedExams = await tx.exam.count({
        where: {
          schoolId,
          endTime: { lt: new Date() }
        }
      })

      return {
        students,
        exams,
        activeExams,
        completedExams
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching school stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
