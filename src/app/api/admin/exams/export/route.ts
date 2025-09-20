import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const examType = searchParams.get('examType') || ''
    const schoolId = searchParams.get('schoolId') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('export') || 'csv'

    // Build where clause based on filters
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { school: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (schoolId) {
      where.schoolId = schoolId
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Get all exams (no pagination for export)
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
        questions: {
          select: {
            id: true,
            type: true,
            points: true
          }
        },
        _count: {
          select: {
            results: true,
            answers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Exam ID',
        'Title',
        'Description',
        'School Name',
        'School Status',
        'Start Time',
        'End Time',
        'Duration (minutes)',
        'Total Questions',
        'Total Points',
        'Registered Students',
        'Completed Students',
        'Question Types',
        'Status',
        'Created At'
      ]

      const csvRows = exams.map(exam => {
        const now = new Date()
        const startTime = new Date(exam.startTime)
        const endTime = new Date(exam.endTime)
        
        let examStatus = 'DRAFT'
        if (now < startTime) {
          examStatus = 'SCHEDULED'
        } else if (now >= startTime && now <= endTime) {
          examStatus = 'ACTIVE'
        } else if (now > endTime) {
          examStatus = 'CLOSED'
        }

        const questionTypes = exam.questions.reduce((acc: any, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1
          return acc
        }, {})

        const questionTypesString = Object.entries(questionTypes)
          .map(([type, count]) => `${type}:${count}`)
          .join(';')

        return [
          exam.id,
          exam.title,
          exam.description || '',
          exam.school.name,
          exam.school.status,
          exam.startTime,
          exam.endTime,
          exam.duration,
          exam.questions.length,
          exam.questions.reduce((sum, q) => sum + q.points, 0),
          exam._count.results,
          exam._count.answers,
          questionTypesString,
          examStatus,
          exam.createdAt
        ]
      })

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => 
          row.map(cell => 
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
              ? `"${cell.replace(/"/g, '""')}"` 
              : cell
          ).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="exams-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Default to JSON if format not recognized
    return NextResponse.json(exams)
  } catch (error) {
    console.error('Error exporting exams:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
