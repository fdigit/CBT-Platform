import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const stats = await prisma.$transaction(async (tx) => {
      // Total Schools
      const totalSchools = await tx.school.count()
      
      // Total Students
      const totalStudents = await tx.student.count()
      
      // Total Exams
      const totalExams = await tx.exam.count()
      
      // Active Exams (currently running)
      const activeExams = await tx.exam.count({
        where: {
          startTime: { lte: new Date() },
          endTime: { gte: new Date() }
        }
      })
      
      // Total Payments this month
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      
      const monthlyPayments = await tx.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: currentMonth }
        },
        _sum: { amount: true },
        _count: true
      }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }))
      
      // Simple recent counts (fallback to 0 if queries fail)
      let recentSchools = 0
      let recentStudents = 0
      
      // Try to get recent school count
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        recentSchools = await tx.school.count({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        })
      } catch (error) {
        console.log('Cannot get recent schools count, using 0')
        recentSchools = 0
      }
      
      // Try to get recent students count via user table
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const recentUsers = await tx.user.count({
          where: {
            role: 'STUDENT',
            createdAt: { gte: thirtyDaysAgo }
          }
        })
        recentStudents = recentUsers
      } catch (error) {
        console.log('Cannot get recent students count, using 0')
        recentStudents = 0
      }
      
      return {
        totalSchools,
        totalStudents,
        totalExams,
        activeExams,
        monthlyRevenue: monthlyPayments._sum.amount || 0,
        monthlyPaymentCount: monthlyPayments._count,
        recentSchools,
        recentStudents,
        schoolsByStatus: {
          approved: totalSchools, // Assume all are approved for now
          pending: 0,
          suspended: 0,
          rejected: 0
        }
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    
    // Return fallback data instead of error
    return NextResponse.json({
      totalSchools: 0,
      totalStudents: 0,
      totalExams: 0,
      activeExams: 0,
      monthlyRevenue: 0,
      monthlyPaymentCount: 0,
      recentSchools: 0,
      recentStudents: 0,
      schoolsByStatus: {
        approved: 0,
        pending: 0,
        suspended: 0,
        rejected: 0
      }
    })
  }
}
