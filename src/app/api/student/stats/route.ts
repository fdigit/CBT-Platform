import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const studentId = session.user.studentProfile?.id
    if (!studentId) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 })
    }

    const stats = await prisma.$transaction(async (tx) => {
      const totalExams = await tx.exam.count({
        where: {
          schoolId: session.user.schoolId
        }
      })

      const completedExams = await tx.result.count({
        where: { studentId }
      })

      const upcomingExams = await tx.exam.count({
        where: {
          schoolId: session.user.schoolId,
          startTime: { gt: new Date() }
        }
      })

      const averageScore = await tx.result.aggregate({
        where: { studentId },
        _avg: { score: true }
      })

      return {
        totalExams,
        completedExams,
        upcomingExams,
        averageScore: Math.round(averageScore._avg.score || 0)
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching student stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
