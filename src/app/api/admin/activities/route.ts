import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const activities = await prisma.$transaction(async (tx) => {
      // Recent school registrations
      const recentSchools = await tx.school.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true
        }
      })

      // Recent payments
      const recentPayments = await tx.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          school: {
            select: {
              name: true
            }
          }
        }
      })

      // Recent exams (completed)
      const recentExams = await tx.exam.findMany({
        take: 5,
        where: {
          endTime: { lt: new Date() }
        },
        orderBy: { endTime: 'desc' },
        include: {
          school: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              results: true
            }
          }
        }
      })

      // Currently active exams
      const activeExams = await tx.exam.findMany({
        take: 3,
        where: {
          startTime: { lte: new Date() },
          endTime: { gte: new Date() }
        },
        orderBy: { startTime: 'desc' },
        include: {
          school: {
            select: {
              name: true
            }
          }
        }
      })

      return {
        recentSchools,
        recentPayments,
        recentExams,
        activeExams
      }
    })

    // Format activities into a unified structure
    const formattedActivities: any[] = []

    // Add school registrations
    activities.recentSchools.forEach(school => {
      formattedActivities.push({
        id: `school-${school.id}`,
        type: 'school' as const,
        title: 'New School Registration',
        description: school.name,
        timestamp: formatTimeAgo(school.createdAt),
        status: school.status.toLowerCase() as 'pending' | 'completed',
        createdAt: school.createdAt
      })
    })

    // Add payments
    activities.recentPayments.forEach(payment => {
      formattedActivities.push({
        id: `payment-${payment.id}`,
        type: 'payment' as const,
        title: 'Payment Received',
        description: `${payment.school.name} - ₦${payment.amount.toLocaleString()}`,
        timestamp: formatTimeAgo(payment.createdAt),
        status: payment.status.toLowerCase() === 'success' ? 'completed' as const : 'pending' as const,
        createdAt: payment.createdAt
      })
    })

    // Add completed exams
    activities.recentExams.forEach(exam => {
      formattedActivities.push({
        id: `exam-${exam.id}`,
        type: 'exam' as const,
        title: 'Exam Completed',
        description: `${exam.title} - ${exam.school.name} (${exam._count.results} participants)`,
        timestamp: formatTimeAgo(exam.endTime),
        status: 'completed' as const,
        createdAt: exam.endTime
      })
    })

    // Add active exams
    activities.activeExams.forEach(exam => {
      formattedActivities.push({
        id: `active-exam-${exam.id}`,
        type: 'exam' as const,
        title: 'Exam In Progress',
        description: `${exam.title} - ${exam.school.name}`,
        timestamp: formatTimeAgo(exam.startTime),
        status: 'active' as const,
        createdAt: exam.startTime
      })
    })

    // Sort by creation time and take top 10
    const sortedActivities = formattedActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return NextResponse.json(sortedActivities)
  } catch (error) {
    console.error('Error fetching admin activities:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }
}
