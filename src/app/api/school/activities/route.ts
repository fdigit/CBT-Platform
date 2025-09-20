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

    // Get recent activities
    const activities = await prisma.$transaction(async (tx) => {
      // Recent student registrations
      const recentStudents = await tx.student.findMany({
        where: { schoolId },
        orderBy: { id: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            }
          }
        }
      })

      // Recent exams created
      const recentExams = await tx.exam.findMany({
        where: { schoolId },
        orderBy: { id: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
        }
      })

      // Recent results published
      const recentResults = await tx.result.findMany({
        where: { 
          exam: { schoolId }
        },
        orderBy: { id: 'desc' },
        take: 5,
        select: {
          id: true,
          score: true,
          gradedAt: true,
          exam: {
            select: {
              title: true,
            }
          },
          student: {
            include: {
              user: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      })

      return {
        students: recentStudents.map(student => ({
          id: student.id,
          type: 'student',
          title: 'New Student Registration',
          description: `${student.user.name} registered for exams`,
          time: student.user.createdAt,
          user: {
            name: student.user.name,
            email: student.user.email
          },
          status: 'completed'
        })),
        exams: recentExams.map(exam => ({
          id: exam.id,
          type: 'exam',
          title: 'Exam Created',
          description: `${exam.title} created`,
          time: exam.createdAt,
          status: 'active'
        })),
        results: recentResults.map(result => ({
          id: result.id,
          type: 'result',
          title: 'Results Published',
          description: `${result.student.user.name} completed ${result.exam.title} with ${result.score}%`,
          time: result.gradedAt,
          status: 'completed'
        }))
      }
    })

    // Combine and sort all activities by time
    const allActivities = [
      ...activities.students,
      ...activities.exams,
      ...activities.results
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json(allActivities.slice(0, 10)) // Return top 10 most recent
  } catch (error) {
    console.error('Error fetching school activities:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
