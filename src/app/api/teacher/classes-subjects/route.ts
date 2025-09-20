import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { 
        user: { select: { name: true } },
        school: true,
        classSubjects: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                academicYear: true,
                status: true
              }
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true
              }
            }
          }
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true
              }
            }
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Extract unique classes from class-subject assignments
    const classesMap = new Map()
    teacher.classSubjects.forEach(cs => {
      if (cs.class.status === 'ACTIVE') {
        classesMap.set(cs.class.id, {
          id: cs.class.id,
          name: cs.class.name,
          section: cs.class.section,
          academicYear: cs.class.academicYear,
          displayName: `${cs.class.name}${cs.class.section ? ` ${cs.class.section}` : ''}`
        })
      }
    })

    // Extract unique subjects from both direct assignments and class-subject assignments
    const subjectsMap = new Map()
    
    // Add subjects from direct teacher-subject assignments
    teacher.subjects.forEach(ts => {
      if (ts.subject.status === 'ACTIVE') {
        subjectsMap.set(ts.subject.id, {
          id: ts.subject.id,
          name: ts.subject.name,
          code: ts.subject.code
        })
      }
    })

    // Add subjects from class-subject assignments
    teacher.classSubjects.forEach(cs => {
      if (cs.subject.status === 'ACTIVE') {
        subjectsMap.set(cs.subject.id, {
          id: cs.subject.id,
          name: cs.subject.name,
          code: cs.subject.code
        })
      }
    })

    const classes = Array.from(classesMap.values()).sort((a, b) => 
      a.displayName.localeCompare(b.displayName)
    )

    const subjects = Array.from(subjectsMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )

    return NextResponse.json({
      classes,
      subjects,
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
        schoolId: teacher.schoolId,
        schoolName: teacher.school.name
      }
    })

  } catch (error) {
    console.error('Error fetching teacher classes and subjects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
