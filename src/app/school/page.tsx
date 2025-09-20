'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SchoolDashboardLayout } from '@/components/school/SchoolDashboardLayout'
import { StatsCard } from '@/components/school/StatsCard'
import { QuickActions } from '@/components/school/QuickActions'
import { DashboardCharts } from '@/components/school/DashboardCharts'
import { RecentActivities } from '@/components/school/RecentActivities'
import { Users, BookOpen, GraduationCap, CreditCard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SchoolStats {
  students: number
  exams: number
  activeExams: number
  completedExams: number
}

export default function SchoolDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<SchoolStats>({
    students: 0,
    exams: 0,
    activeExams: 0,
    completedExams: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/school/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch school statistics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value={stats.students}
            description="Registered students"
            icon={Users}
            iconColor="text-blue-600"
            trend={{ value: 12, isPositive: true }}
            onClick={() => router.push('/school/students')}
          />
          <StatsCard
            title="Total Teachers"
            value="8"
            description="Active teachers"
            icon={GraduationCap}
            iconColor="text-green-600"
            trend={{ value: 5, isPositive: true }}
            onClick={() => router.push('/school/teachers')}
          />
          <StatsCard
            title="Active Exams"
            value={stats.activeExams}
            description="Currently running"
            icon={BookOpen}
            iconColor="text-orange-600"
            trend={{ value: 8, isPositive: true }}
            onClick={() => router.push('/school/exams')}
          />
          <StatsCard
            title="Subscription Status"
            value="Premium"
            description="Valid until Dec 2024"
            icon={CreditCard}
            iconColor="text-purple-600"
          />
        </div>

        {/* Charts */}
        <DashboardCharts />

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Recent Activities */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <RecentActivities />
        </div>
      </div>
    </SchoolDashboardLayout>
  )
}
