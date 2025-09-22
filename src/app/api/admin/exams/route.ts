import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDynamicStatus } from '@/lib/exam-status'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const subject = searchParams.get('subject') || ''
    const examType = searchParams.get('examType') || ''
    const schoolId = searchParams.get('schoolId') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause based on filters
    const where: any = {}

    // School admin can only see their school's exams
    if (session.user.role === 'SCHOOL_ADMIN') {
      where.schoolId = session.user.schoolId
    } else if (schoolId) {
      where.schoolId = schoolId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { school: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.exam.count({ where })

    // Get exams with pagination
    const exams = await prisma.exam.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        teacher: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        subject: {
          select: { name: true, code: true }
        },
        class: {
          select: { name: true, section: true }
        },
        approver: {
          select: { name: true }
        },
        questions: {
          select: {
            id: true,
            type: true,
            points: true,
            difficulty: true
          }
        },
        attempts: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            submittedAt: true
          }
        },
        results: {
          select: {
            id: true,
            score: true,
            gradedAt: true
          }
        },
        _count: {
          select: {
            results: true,
            answers: true,
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Calculate additional fields for each exam using unified logic
    const examsWithStats = exams.map(exam => {
      const now = new Date()
      
      // Use unified status calculation
      const dynamicStatus = getDynamicStatus({
        id: exam.id,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        maxAttempts: exam.maxAttempts,
        manualControl: exam.manualControl,
        isLive: exam.isLive,
        isCompleted: exam.isCompleted,
        status: exam.status,
        attempts: exam.attempts,
        results: exam.results
      }, now)

      // Determine exam type based on questions
      let examType = 'MIXED'
      const questionTypes = exam.questions.map(q => q.type)
      if (questionTypes.length > 0) {
        if (questionTypes.every(type => type === 'MCQ')) {
          examType = 'OBJECTIVE'
        } else if (questionTypes.every(type => type === 'ESSAY')) {
          examType = 'THEORY'
        } else if (questionTypes.some(type => type === 'MCQ') && questionTypes.some(type => type === 'TRUE_FALSE')) {
          examType = 'CBT'
        }
      }

      return {
        ...exam,
        dynamicStatus,
        examType,
        totalQuestions: exam.questions.length,
        totalMarks: exam.questions.reduce((sum, q) => sum + q.points, 0),
        studentsAttempted: exam._count.attempts || 0,
        studentsCompleted: exam._count.results || 0,
        questionsAnswered: exam._count.answers || 0,
        teacherName: exam.teacher?.user?.name || 'Unknown',
        subjectName: exam.subject?.name || 'General',
        className: exam.class ? `${exam.class.name} ${exam.class.section || ''}` : 'All Classes',
        approverName: exam.approver?.name || null,
        questionsByType: exam.questions.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        questionsByDifficulty: exam.questions.reduce((acc, q) => {
          acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    })

    return NextResponse.json({
      exams: examsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching admin exams:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}