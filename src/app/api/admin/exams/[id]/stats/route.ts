import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const examId = id

    // Get exam with detailed stats
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        questions: {
          select: {
            id: true,
            type: true,
            points: true
          }
        },
        results: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        answers: {
          select: {
            studentId: true
          },
          distinct: ['studentId']
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ message: 'Exam not found' }, { status: 404 })
    }

    // Calculate statistics
    const totalQuestions = exam.questions.length
    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0)
    const registeredStudents = exam.answers.length // Unique students who attempted
    const completedStudents = exam.results.length
    const averageScore = exam.results.length > 0 
      ? exam.results.reduce((sum, r) => sum + r.score, 0) / exam.results.length 
      : 0

    // Question type breakdown
    const questionTypeBreakdown = exam.questions.reduce((acc: any, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1
      return acc
    }, {})

    // Performance distribution
    const scoreRanges = {
      excellent: exam.results.filter(r => r.score >= 80).length,
      good: exam.results.filter(r => r.score >= 60 && r.score < 80).length,
      average: exam.results.filter(r => r.score >= 40 && r.score < 60).length,
      poor: exam.results.filter(r => r.score < 40).length
    }

    const stats = {
      examId,
      title: exam.title,
      school: exam.school,
      totalQuestions,
      totalPoints,
      registeredStudents,
      completedStudents,
      completionRate: registeredStudents > 0 ? (completedStudents / registeredStudents) * 100 : 0,
      averageScore: Math.round(averageScore * 100) / 100,
      questionTypeBreakdown,
      performanceDistribution: scoreRanges,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      createdAt: exam.createdAt
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching exam stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
