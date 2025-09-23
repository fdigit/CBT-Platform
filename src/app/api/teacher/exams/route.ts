import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { getDynamicStatus } from '../../../lib/exam-status'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const subject = searchParams.get('subject') || ''

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true } },
        school: { select: { id: true, name: true } }
      }
    })

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      teacherId: teacher.id,
      schoolId: teacher.schoolId
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    if (status) {
      where.status = status
    }

    if (subject) {
      where.subjectId = subject
    }

    // Get exams with pagination
    const [exams, totalCount] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          subject: {
            select: {
              name: true,
              code: true
            }
          },
          class: {
            select: {
              name: true,
              section: true
            }
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
              attempts: true,
              answers: true
            }
          },
          approver: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.exam.count({ where })
    ])

    // Add computed fields using unified logic
    const now = new Date()
    const examsWithStats = exams.map(exam => {
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

      return {
        ...exam,
        totalQuestions: exam.questions.length,
        totalMarks: exam.questions.reduce((sum, q) => sum + q.points, 0),
        studentsAttempted: exam._count.attempts || 0,
        studentsCompleted: exam._count.results || 0,
        subjectName: exam.subject?.name || 'General',
        className: exam.class ? `${exam.class.name} ${exam.class.section || ''}` : 'All Classes',
        approverName: exam.approver?.name || null,
        dynamicStatus
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
    console.error('Error fetching teacher exams:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true } },
        school: { select: { id: true, name: true } },
        subjects: { include: { subject: true } },
        classSubjects: {
          include: {
            subject: true,
            class: true
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      subjectId, 
      classId, 
      startTime, 
      endTime, 
      duration, 
      totalMarks,
      passingMarks,
      instructions,
      shuffle,
      negativeMarking,
      allowPreview,
      showResultsImmediately,
      maxAttempts,
      questions 
    } = body

    // Validation
    if (!title || !startTime || !endTime || !duration || !questions || questions.length === 0) {
      return NextResponse.json({ 
        message: 'Missing required fields: title, startTime, endTime, duration, questions' 
      }, { status: 400 })
    }

    // Validate teacher access to class and subject (allow flexibility for 'all' and 'general')
    if (classId !== 'all' && subjectId !== 'general') {
      const hasAccess = teacher.classSubjects.some(cs =>
        cs.subjectId === subjectId && cs.classId === classId
      )
      
      if (!hasAccess) {
        // Fallback: check if teacher has access to the class through any subject
        const hasClassAccess = teacher.classSubjects.some(cs => cs.classId === classId)
        
        if (!hasClassAccess) {
          return NextResponse.json({ 
            message: 'You do not have access to this class/subject combination' 
          }, { status: 403 })
        }
      }
    }

    // Calculate total marks from questions if not provided
    const calculatedTotalMarks = totalMarks || questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0)

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        subjectId: subjectId === 'general' ? null : subjectId,
        classId: classId === 'all' ? null : classId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        totalMarks: calculatedTotalMarks,
        passingMarks: passingMarks || Math.ceil(calculatedTotalMarks * 0.4),
        shuffle: shuffle || false,
        negativeMarking: negativeMarking || false,
        allowPreview: allowPreview || false,
        showResultsImmediately: showResultsImmediately || false,
        maxAttempts: maxAttempts || 1,
        status: 'DRAFT',
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
        questions: {
          create: questions.map((q: any, index: number) => ({
            type: q.type,
            text: q.question || q.text, // Support both field names
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            points: q.points || 1,
            explanation: q.explanation,
            difficulty: q.difficulty || 'MEDIUM',
            order: index + 1,
            imageUrl: q.imageUrl,
            audioUrl: q.audioUrl,
            videoUrl: q.videoUrl,
            tags: q.tags || []
          }))
        }
      },
      include: {
        questions: true,
        subject: { select: { name: true } },
        class: { select: { name: true, section: true } }
      }
    })

    return NextResponse.json(exam, { status: 201 })

  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
