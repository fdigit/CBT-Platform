import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const reportType = searchParams.get('type') || 'summary'
    const dateRange = searchParams.get('dateRange') || 'last30days'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last7days':
        startDate.setDate(now.getDate() - 7)
        break
      case 'last30days':
        startDate.setDate(now.getDate() - 30)
        break
      case 'last90days':
        startDate.setDate(now.getDate() - 90)
        break
      case 'last12months':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    let data: any[] = []
    let filename = ''

    switch (reportType) {
      case 'users':
        data = await prisma.user.findMany({
          where: {
            createdAt: { gte: startDate }
          },
          select: {
            name: true,
            email: true,
            role: true,
            createdAt: true,
            school: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        filename = `users-report-${dateRange}`
        break

      case 'schools':
        data = await prisma.school.findMany({
          where: {
            createdAt: { gte: startDate }
          },
          select: {
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                users: true,
                exams: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        filename = `schools-report-${dateRange}`
        break

      case 'exams':
        data = await prisma.exam.findMany({
          where: {
            createdAt: { gte: startDate }
          },
          select: {
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            duration: true,
            shuffle: true,
            negativeMarking: true,
            createdAt: true,
            school: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                questions: true,
                results: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        filename = `exams-report-${dateRange}`
        break

      case 'payments':
        data = await prisma.payment.findMany({
          where: {
            createdAt: { gte: startDate }
          },
          select: {
            reference: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            school: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }).catch(() => [])
        filename = `payments-report-${dateRange}`
        break

      default: // summary
        const summary = await prisma.$transaction(async (tx) => {
          const totalSchools = await tx.school.count()
          const totalUsers = await tx.user.count()
          const totalExams = await tx.exam.count()
          const totalStudents = await tx.user.count({ where: { role: 'STUDENT' } })
          
          const monthlyRevenue = await tx.payment.aggregate({
            where: {
              status: 'SUCCESS',
              createdAt: { gte: startDate }
            },
            _sum: { amount: true },
            _count: true
          }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }))

          return [{
            metric: 'Total Schools',
            value: totalSchools,
            period: dateRange
          }, {
            metric: 'Total Users',
            value: totalUsers,
            period: dateRange
          }, {
            metric: 'Total Students',
            value: totalStudents,
            period: dateRange
          }, {
            metric: 'Total Exams',
            value: totalExams,
            period: dateRange
          }, {
            metric: 'Monthly Revenue',
            value: monthlyRevenue._sum.amount || 0,
            period: dateRange
          }, {
            metric: 'Monthly Payments',
            value: monthlyRevenue._count,
            period: dateRange
          }]
        })
        data = summary
        filename = `summary-report-${dateRange}`
    }

    if (format === 'csv') {
      const csvContent = convertToCSV(data)
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      })
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`
        }
      })
    } else {
      return NextResponse.json({ message: 'Unsupported format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error exporting reports:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return ''
  }

  // Get headers from the first object
  const headers = Object.keys(data[0])
  
  // Flatten nested objects for CSV
  const flattenedData = data.map(item => {
    const flattened: any = {}
    
    headers.forEach(header => {
      if (item[header] && typeof item[header] === 'object' && !Array.isArray(item[header]) && !(item[header] instanceof Date)) {
        // Handle nested objects (like school.name)
        Object.keys(item[header]).forEach(nestedKey => {
          flattened[`${header}.${nestedKey}`] = item[header][nestedKey]
        })
      } else if (item[header] instanceof Date) {
        flattened[header] = item[header].toISOString()
      } else {
        flattened[header] = item[header]
      }
    })
    
    return flattened
  })

  // Get all possible headers including nested ones
  const allHeaders = Array.from(new Set(flattenedData.flatMap(item => Object.keys(item))))
  
  // Create CSV content
  const csvRows = [
    allHeaders.join(','), // Header row
    ...flattenedData.map(item => 
      allHeaders.map(header => {
        const value = item[header]
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}
