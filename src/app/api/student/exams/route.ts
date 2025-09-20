import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: { 
        school: true,
        class: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'available'
    const search = searchParams.get('search')

    const now = new Date()

    // Build where clause - only show published exams
    let where: any = {
      schoolId: student.schoolId,
      status: {
        in: ['PUBLISHED', 'APPROVED']
      },
      OR: [
        { classId: student.classId }, // Exams for student's class
        { classId: null } // General exams for all classes
      ]
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }
      ]
    }

    // Filter by status
    if (status === 'upcoming') {
      where.startTime = { gt: now }
    } else if (status === 'active') {
      where.AND = [
        ...(where.AND || []),
        { startTime: { lte: now } },
        { endTime: { gte: now } }
      ]
    } else if (status === 'completed') {
      where.endTime = { lt: now }
    }


    // Get exams with student's attempts and results
    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: {
          select: { name: true, code: true }
        },
        class: {
          select: { name: true, section: true }
        },
        teacher: {
          include: {
            user: { select: { name: true } }
          }
        },
        questions: {
          select: {
            id: true,
            points: true,
            type: true
          }
        },
        attempts: {
          where: { studentId: student.id },
          orderBy: { attemptNumber: 'desc' },
          take: 1
        },
        results: {
          where: { studentId: student.id }
        }
      },
      orderBy: [
        { startTime: 'asc' }
      ]
    })


    // Calculate exam statistics and student status
    const examsWithStatus = exams.map(exam => {
      const startTime = new Date(exam.startTime)
      const endTime = new Date(exam.endTime)
      const totalMarks = exam.questions.reduce((sum, q) => sum + q.points, 0)
      
      // Determine exam status for student
      let examStatus = 'upcoming'
      let canTake = false
      let timeRemaining = 0

      if (now < startTime) {
        examStatus = 'upcoming'
        timeRemaining = startTime.getTime() - now.getTime()
      } else if (now >= startTime && now <= endTime) {
        examStatus = 'active'
        canTake = true
        timeRemaining = endTime.getTime() - now.getTime()
      } else {
        examStatus = 'completed'
      }

      // Check student's attempts and results
      const latestAttempt = exam.attempts[0]
      const result = exam.results[0]
      
      let studentStatus = 'not_started'
      let score = null
      let attemptCount = exam.attempts.length

      if (result) {
        studentStatus = 'completed'
        score = result.score
      } else if (latestAttempt) {
        if (latestAttempt.status === 'IN_PROGRESS') {
          studentStatus = 'in_progress'
          canTake = true // Can resume
        } else if (latestAttempt.status === 'SUBMITTED') {
          studentStatus = 'submitted'
        }
      }

      // Check if student can take/retake exam
      if (examStatus === 'active' && attemptCount < exam.maxAttempts && studentStatus !== 'in_progress') {
        canTake = true
      }

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        totalMarks,
        passingMarks: exam.passingMarks,
        maxAttempts: exam.maxAttempts,
        allowPreview: exam.allowPreview,
        showResultsImmediately: exam.showResultsImmediately,
        examStatus,
        studentStatus,
        canTake,
        timeRemaining,
        score,
        attemptCount,
        totalQuestions: exam.questions.length,
        subject: exam.subject,
        class: exam.class,
        teacherName: exam.teacher?.user?.name || 'Unknown',
        questionTypes: exam.questions.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    })

    return NextResponse.json({
      exams: examsWithStatus
    })

  } catch (error) {
    console.error('Error fetching student exams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
