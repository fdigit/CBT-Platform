'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ReportsFilters, type ReportsFilters as ReportsFiltersType } from '@/components/admin/ReportsFilters'
import { 
  UserGrowthChart, 
  ExamsPerSchoolChart, 
  UserRoleDistributionChart, 
  SchoolPerformanceChart,
  RevenueAnalyticsChart 
} from '@/components/admin/ReportsCharts'
import { ReportsActivityTable } from '@/components/admin/ReportsActivityTable'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  School, 
  Users, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  Activity,
  Download,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  Calendar
} from 'lucide-react'

interface ReportsData {
  summary: {
    totalSchools: number
    totalUsers: number
    totalExams: number
    totalStudents: number
    activeSchools: number
    activeExams: number
    monthlyRevenue: number
    monthlyPayments: number
  }
  charts: {
    userGrowth: Array<{ month: string; users: number }>
    examsPerSchool: Array<{ name: string; exams: number }>
    userRoleDistribution: Array<{ name: string; value: number; color: string }>
    schoolsByStatus: Array<{ name: string; value: number }>
  }
  activities: {
    recentRegistrations: Array<any>
    recentSchools: Array<any>
    recentExams: Array<any>
  }
  analytics: {
    exam: {
      totalExams: number
      activeExams: number
      completedExams: number
      scheduledExams: number
    }
    performance: {
      averageScore: number
    }
  }
  insights: {
    topPerformingSchools: Array<any>
    growthTrend: number
    alerts: Array<any>
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportsFiltersType>({
    dateRange: 'last30days'
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  const fetchReportsData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        dateRange: filters.dateRange,
        ...(filters.schoolId && { schoolId: filters.schoolId }),
        ...(filters.role && { role: filters.role }),
        ...(filters.examType && { examType: filters.examType }),
        ...(filters.customDateFrom && { customDateFrom: filters.customDateFrom.toISOString() }),
        ...(filters.customDateTo && { customDateTo: filters.customDateTo.toISOString() })
      })

      const [reportsResponse, schoolsResponse] = await Promise.all([
        fetch(`/api/admin/reports?${params}`),
        fetch('/api/admin/schools')
      ])

      if (reportsResponse.ok) {
        const data = await reportsResponse.json()
        setReportsData(data)
      } else {
        throw new Error(`Failed to fetch reports data: ${reportsResponse.status}`)
      }

      if (schoolsResponse.ok) {
        const schoolsData = await schoolsResponse.json()
        setSchools(schoolsData.schools || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        title: "Error",
        description: `Failed to load reports data. Please try again.`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  const handleExport = async (format: 'csv' | 'json' | 'pdf', reportType = 'summary') => {
    try {
      const params = new URLSearchParams({
        format,
        type: reportType,
        dateRange: filters.dateRange,
        ...(filters.schoolId && { schoolId: filters.schoolId }),
        ...(filters.role && { role: filters.role }),
        ...(filters.examType && { examType: filters.examType })
      })

      const response = await fetch(`/api/admin/reports/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${reportType}-report-${filters.dateRange}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Successful",
          description: `Report exported as ${format.toUpperCase()} successfully.`
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`
    }
    return `₦${amount.toLocaleString()}`
  }

  // Transform activities data for the activity table
  const allActivities = reportsData ? [
    ...reportsData.activities.recentRegistrations.map(user => ({
      id: `user-${user.id}`,
      type: 'user_registration' as const,
      title: `New user registered: ${user.name}`,
      description: `${user.role} joined ${user.school?.name || 'the platform'}`,
      user: { name: user.name, email: user.email, role: user.role },
      school: user.school,
      createdAt: user.createdAt,
      status: 'success' as const
    })),
    ...reportsData.activities.recentSchools.map(school => ({
      id: `school-${school.id}`,
      type: 'school_approval' as const,
      title: `School registered: ${school.name}`,
      description: `New school application ${school.status.toLowerCase()}`,
      school: { name: school.name },
      createdAt: school.createdAt,
      status: school.status === 'APPROVED' ? 'success' as const : 'pending' as const
    })),
    ...reportsData.activities.recentExams.map(exam => ({
      id: `exam-${exam.id}`,
      type: 'exam_created' as const,
      title: `Exam created: ${exam.title}`,
      description: `New exam created by ${exam.school.name}`,
      school: exam.school,
      createdAt: exam.createdAt,
      status: 'success' as const
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights and analytics for your platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={fetchReportsData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <ReportsFilters
          filters={filters}
          onFiltersChange={setFilters}
          schools={schools}
          onRefresh={fetchReportsData}
          onExport={handleExport}
          loading={loading}
        />

        {/* Insights & Alerts */}
        {reportsData?.insights?.alerts && reportsData.insights.alerts.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {reportsData.insights.alerts.length} alert(s) detected. Review platform activity for unusual patterns.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Schools"
            value={reportsData?.summary.totalSchools?.toString() || '0'}
            icon={School}
            change={{ value: 12, type: 'increase' }}
            description={`${reportsData?.summary.activeSchools || 0} active`}
          />
          <StatsCard
            title="Total Users"
            value={reportsData?.summary.totalUsers?.toString() || '0'}
            icon={Users}
            change={{ 
              value: Math.round(reportsData?.insights.growthTrend || 0), 
              type: (reportsData?.insights.growthTrend || 0) >= 0 ? 'increase' : 'decrease' 
            }}
            description={`${reportsData?.summary.totalStudents || 0} students`}
          />
          <StatsCard
            title="Active Exams"
            value={reportsData?.summary.activeExams?.toString() || '0'}
            icon={BookOpen}
            change={{ value: 8, type: 'increase' }}
            description={`${reportsData?.summary.totalExams || 0} total exams`}
          />
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(reportsData?.summary.monthlyRevenue || 0)}
            icon={CreditCard}
            change={{ value: 15, type: 'increase' }}
            description={`${reportsData?.summary.monthlyPayments || 0} payments`}
          />
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              Schools
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserGrowthChart
                data={reportsData?.charts.userGrowth || []}
                loading={loading}
                title="User Growth Over Time"
                description="Monthly user registration trends"
                onExport={() => handleExport('csv', 'users')}
              />
              <ExamsPerSchoolChart
                data={reportsData?.charts.examsPerSchool || []}
                loading={loading}
                title="Exams per School"
                description="Top schools by exam creation"
                onExport={() => handleExport('csv', 'exams')}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserRoleDistributionChart
                data={reportsData?.charts.userRoleDistribution || []}
                loading={loading}
                title="User Role Distribution"
                description="Platform users by role"
                onExport={() => handleExport('csv', 'users')}
              />
              <RevenueAnalyticsChart
                data={[]} // Will be populated with revenue data
                loading={loading}
                title="Revenue Analytics"
                description="Monthly revenue trends"
                onExport={() => handleExport('csv', 'payments')}
              />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <UserGrowthChart
                data={reportsData?.charts.userGrowth || []}
                loading={loading}
                title="User Registration Trends"
                description="Detailed user growth analytics"
                onExport={() => handleExport('csv', 'users')}
              />
              <UserRoleDistributionChart
                data={reportsData?.charts.userRoleDistribution || []}
                loading={loading}
                title="User Demographics"
                description="User distribution across roles and schools"
                onExport={() => handleExport('csv', 'users')}
              />
            </div>
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <ExamsPerSchoolChart
                data={reportsData?.charts.examsPerSchool || []}
                loading={loading}
                title="School Performance Metrics"
                description="Comprehensive school analytics"
                onExport={() => handleExport('csv', 'schools')}
              />
              <SchoolPerformanceChart
                data={reportsData?.insights.topPerformingSchools?.map(school => ({
                  name: school.name,
                  exams: school._count?.exams || 0,
                  performance: 85 + Math.random() * 15 // Mock performance score
                })) || []}
                loading={loading}
                title="School Performance Analysis"
                description="Exam creation and performance metrics"
                onExport={() => handleExport('csv', 'schools')}
              />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ReportsActivityTable
              activities={allActivities}
              loading={loading}
              title="Recent Platform Activity"
              description="Latest registrations, approvals, and exam activities"
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
