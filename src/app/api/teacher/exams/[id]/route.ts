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
    const { id } = await params
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Get exam with full details
    const exam = await prisma.exam.findFirst({
      where: {
        id,
        teacherId: teacher.id, // Ensure teacher owns this exam
      },
      include: {
        subject: {
          select: { name: true, code: true }
        },
        class: {
          select: { name: true, section: true }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        attempts: {
          include: {
            student: {
              select: {
                id: true,
                regNumber: true,
                user: { select: { name: true } }
              }
            }
          }
        },
        results: {
          include: {
            student: {
              select: {
                id: true,
                regNumber: true,
                user: { select: { name: true } }
              }
            }
          }
        },
        approver: {
          select: { name: true }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Calculate statistics
    const totalMarks = exam.questions.reduce((sum, q) => sum + q.points, 0)
    const studentsAttempted = exam.attempts.length
    const studentsCompleted = exam.results.length
    const averageScore = exam.results.length > 0 
      ? exam.results.reduce((sum, r) => sum + r.score, 0) / exam.results.length 
      : 0

    const examWithStats = {
      ...exam,
      totalMarks,
      studentsAttempted,
      studentsCompleted,
      averageScore,
      questionsByType: exam.questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      questionsByDifficulty: exam.questions.reduce((acc, q) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({ exam: examWithStats })

  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Check if exam exists and belongs to teacher
    const existingExam = await prisma.exam.findFirst({
      where: {
        id,
        teacherId: teacher.id,
      }
    })

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 })
    }

    // Check if exam can be edited (not published or completed)
    if (['PUBLISHED', 'ACTIVE', 'COMPLETED'].includes(existingExam.status)) {
      return NextResponse.json(
        { error: 'Cannot edit exam that is published, active, or completed' },
        { status: 400 }
      )
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
      shuffle,
      negativeMarking,
      allowPreview,
      showResultsImmediately,
      maxAttempts,
      assignmentType,
      assignedStudentIds,
      questions,
      status
    } = body

    // Validate teacher has access to the class and subject if specified and changed
    if (classId && classId !== 'all' && classId !== existingExam.classId) {
      // Only validate if a specific class is selected (not "all")
      const classAccess = await prisma.classSubject.findFirst({
        where: {
          classId,
          teacherId: teacher.id,
          ...(subjectId && subjectId !== 'general' ? { subjectId } : {})
        }
      })

      if (!classAccess) {
        // Check if teacher has access to the class through any subject
        const anyClassAccess = await prisma.classSubject.findFirst({
          where: {
            classId,
            teacherId: teacher.id
          }
        })

        if (!anyClassAccess) {
          return NextResponse.json(
            { error: 'You do not have access to this class' },
            { status: 403 }
          )
        }
      }
    }

    // Update exam and questions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update exam
      const updatedExam = await tx.exam.update({
        where: { id },
        data: {
          title: title || existingExam.title,
          description,
          startTime: startTime ? new Date(startTime) : existingExam.startTime,
          endTime: endTime ? new Date(endTime) : existingExam.endTime,
          duration: duration || existingExam.duration,
          totalMarks: totalMarks || existingExam.totalMarks,
          passingMarks,
          shuffle: shuffle !== undefined ? shuffle : existingExam.shuffle,
          negativeMarking: negativeMarking !== undefined ? negativeMarking : existingExam.negativeMarking,
          allowPreview: allowPreview !== undefined ? allowPreview : existingExam.allowPreview,
          showResultsImmediately: showResultsImmediately !== undefined ? showResultsImmediately : existingExam.showResultsImmediately,
          maxAttempts: maxAttempts || existingExam.maxAttempts,
          assignmentType: assignmentType || existingExam.assignmentType,
          assignedStudentIds: assignedStudentIds || existingExam.assignedStudentIds,
          status: status || existingExam.status,
          classId: (classId && classId !== 'all') ? classId : null,
          subjectId: (subjectId && subjectId !== 'general') ? subjectId : null,
        }
      })

      // If questions are provided, update them
      if (questions) {
        // Delete existing questions
        await tx.question.deleteMany({
          where: { examId: id }
        })

        // Create new questions
        const createdQuestions = await Promise.all(
          questions.map((question: any, index: number) =>
            tx.question.create({
              data: {
                text: question.text,
                type: question.type,
                options: question.options || null,
                correctAnswer: question.correctAnswer || null,
                points: question.points || 1,
                order: index + 1,
                imageUrl: question.imageUrl,
                audioUrl: question.audioUrl,
                videoUrl: question.videoUrl,
                explanation: question.explanation,
                difficulty: question.difficulty || 'MEDIUM',
                tags: question.tags || [],
                examId: id,
              }
            })
          )
        )

        return { exam: updatedExam, questions: createdQuestions }
      }

      return { exam: updatedExam, questions: [] }
    })

    return NextResponse.json({
      message: 'Exam updated successfully',
      exam: result.exam,
      questionsCount: result.questions.length
    })

  } catch (error) {
    console.error('Error updating exam:', error)
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Check if exam exists and belongs to teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id,
        teacherId: teacher.id,
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 })
    }

    // Check if exam can be deleted (not published, active, or has attempts)
    if (['PUBLISHED', 'ACTIVE', 'COMPLETED'].includes(exam.status)) {
      return NextResponse.json(
        { error: 'Cannot delete exam that is published, active, or completed' },
        { status: 400 }
      )
    }

    // Check if there are any attempts
    const attemptCount = await prisma.examAttempt.count({
      where: { examId: id }
    })

    if (attemptCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete exam that has student attempts' },
        { status: 400 }
      )
    }

    // Delete exam (cascade will handle questions, answers, etc.)
    await prisma.exam.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Exam deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting exam:', error)
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    )
  }
}
