import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get the teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher profile not found' }, { status: 404 })
    }

    // Get all class-subject assignments for this teacher
    const classSubjectAssignments = await prisma.classSubject.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            academicYear: true,
            description: true,
            room: true,
            maxStudents: true,
            _count: {
              select: {
                students: true,
                exams: true
              }
            }
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { class: { name: 'asc' } },
        { class: { section: 'asc' } },
        { subject: { name: 'asc' } }
      ]
    })

    // Group assignments by class
    const classesMap = new Map()
    
    classSubjectAssignments.forEach(assignment => {
      const classId = assignment.class.id
      const classKey = `${assignment.class.name}${assignment.class.section || ''}`
      
      if (!classesMap.has(classId)) {
        classesMap.set(classId, {
          id: assignment.class.id,
          name: assignment.class.name,
          section: assignment.class.section,
          academicYear: assignment.class.academicYear,
          description: assignment.class.description,
          room: assignment.class.room,
          maxStudents: assignment.class.maxStudents,
          studentCount: assignment.class._count.students,
          examCount: assignment.class._count.exams,
          displayName: `${assignment.class.name}${assignment.class.section ? ` ${assignment.class.section}` : ''} (${assignment.class.academicYear})`,
          subjects: []
        })
      }
      
      const classData = classesMap.get(classId)
      classData.subjects.push({
        id: assignment.subject.id,
        name: assignment.subject.name,
        code: assignment.subject.code,
        assignmentId: assignment.id
      })
    })

    // Convert map to array and calculate additional metrics
    const classes = Array.from(classesMap.values()).map(async (cls) => {
      // Get average scores for this teacher's classes (mock data for now)
      // In real implementation, you would calculate from exam results
      const averageScore = Math.floor(Math.random() * 20) + 70 // Mock: 70-90
      const attendanceRate = Math.floor(Math.random() * 15) + 85 // Mock: 85-100
      
      return {
        ...cls,
        averageScore,
        attendanceRate,
        subjectCount: cls.subjects.length,
        nextLesson: cls.subjects.length > 0 ? `${cls.subjects[0].name} - Next Topic` : 'No subjects assigned'
      }
    })

    const resolvedClasses = await Promise.all(classes)

    return NextResponse.json({
      classes: resolvedClasses,
      summary: {
        totalClasses: resolvedClasses.length,
        totalSubjects: classSubjectAssignments.length,
        totalStudents: resolvedClasses.reduce((sum, cls) => sum + cls.studentCount, 0)
      }
    })
  } catch (error) {
    console.error('Error fetching teacher classes:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
