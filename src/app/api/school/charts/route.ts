import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

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

    // Get chart data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const chartData = await prisma.$transaction(async (tx) => {
      // Student registration growth (monthly)
      const studentRegistrations = await tx.user.groupBy({
        by: ['createdAt'],
        where: { 
          schoolId,
          role: 'STUDENT',
          createdAt: { gte: sixMonthsAgo }
        },
        _count: true,
        orderBy: { createdAt: 'asc' }
      })

      // Exams conducted (monthly)
      const examsConducted = await tx.exam.groupBy({
        by: ['createdAt'],
        where: { 
          schoolId,
          createdAt: { gte: sixMonthsAgo }
        },
        _count: true,
        orderBy: { createdAt: 'asc' }
      })

      // Student performance distribution
      const performanceDistribution = await tx.result.findMany({
        where: {
          exam: { schoolId }
        },
        select: {
          score: true,
        }
      })

      return {
        studentRegistrations,
        examsConducted,
        performanceDistribution
      }
    })

    // Process student registration data
    const monthlyStudentData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      const count = chartData.studentRegistrations.filter(reg => {
        const regDate = new Date(reg.createdAt)
        return regDate.getMonth() === date.getMonth() && regDate.getFullYear() === date.getFullYear()
      }).length

      monthlyStudentData.push({
        month: monthName,
        students: count
      })
    }

    // Process exams conducted data
    const monthlyExamData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      const count = chartData.examsConducted.filter(exam => {
        const examDate = new Date(exam.createdAt)
        return examDate.getMonth() === date.getMonth() && examDate.getFullYear() === date.getFullYear()
      }).length

      monthlyExamData.push({
        month: monthName,
        exams: count
      })
    }

    // Process performance distribution
    const performanceData = [
      { name: 'Excellent (90-100%)', value: 0, color: '#10b981' },
      { name: 'Good (80-89%)', value: 0, color: '#3b82f6' },
      { name: 'Average (70-79%)', value: 0, color: '#f59e0b' },
      { name: 'Below Average (<70%)', value: 0, color: '#ef4444' },
    ]

    chartData.performanceDistribution.forEach(result => {
      if (result.score >= 90) {
        performanceData[0].value++
      } else if (result.score >= 80) {
        performanceData[1].value++
      } else if (result.score >= 70) {
        performanceData[2].value++
      } else {
        performanceData[3].value++
      }
    })

    // Convert to percentages
    const totalResults = chartData.performanceDistribution.length
    if (totalResults > 0) {
      performanceData.forEach(item => {
        item.value = Math.round((item.value / totalResults) * 100)
      })
    }

    return NextResponse.json({
      studentRegistrationData: monthlyStudentData,
      examConductedData: monthlyExamData,
      performanceData
    })
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
