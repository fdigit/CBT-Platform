'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { 
  ExamSummaryStats, 
  ExamFilters, 
  ExamTable,
  ExamAnalytics,
  type ExamFilters as ExamFiltersType
} from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Download, RefreshCw, BarChart3, List } from 'lucide-react'

interface ExamData {
  id: string
  title: string
  description?: string
  school: {
    id: string
    name: string
    status: string
  }
  startTime: string
  endTime: string
  duration: number
  examStatus: string
  examType: string
  registeredStudents: number
  totalQuestions: number
  totalPoints: number
  createdAt: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

interface SummaryStats {
  totalExams: number
  activeExams: number
  scheduledExams: number
  closedExams: number
  pendingApprovals: number
}

export default function ExamsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [exams, setExams] = useState<ExamData[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  })
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalExams: 0,
    activeExams: 0,
    scheduledExams: 0,
    closedExams: 0,
    pendingApprovals: 0
  })
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<ExamFiltersType>({
    search: '',
    status: '',
    examType: '',
    schoolId: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Fetch exams data
  const fetchExams = useCallback(async (page = 1, currentFilters = filters) => {
    try {
      setLoading(page === 1)
      setRefreshing(page !== 1)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(currentFilters).filter(([_, value]) => value !== '')
        )
      })

      const response = await fetch(`/api/admin/exams?${params}`)
      const data = await response.json()

      if (response.ok) {
        setExams(data.exams)
        setPagination(data.pagination)
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to fetch exams',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch exams',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, toast])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/exams/analytics')
      const data = await response.json()

      if (response.ok) {
        setSummaryStats(data.summary)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }, [])

  // Fetch schools list
  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/schools')
      const data = await response.json()

      if (response.ok) {
        setSchools(data.schools?.map((school: any) => ({
          id: school.id,
          name: school.name
        })) || [])
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    if (session?.user.role === 'SUPER_ADMIN') {
      fetchExams(1)
      fetchAnalytics()
      fetchSchools()
    }
  }, [session, fetchExams, fetchAnalytics, fetchSchools])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ExamFiltersType) => {
    setFilters(newFilters)
    fetchExams(1, newFilters)
  }, [fetchExams])

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    fetchExams(page)
  }, [fetchExams])

  // Handle bulk actions
  const handleBulkAction = useCallback(async (examIds: string[], action: string, reason?: string) => {
    try {
      const response = await fetch('/api/admin/exams/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ examIds, action, reason })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message
        })
        fetchExams(pagination.currentPage)
        fetchAnalytics()
      } else {
        toast({
          title: 'Error',
          description: data.message || `Failed to ${action} exams`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} exams`,
        variant: 'destructive'
      })
    }
  }, [pagination.currentPage, fetchExams, fetchAnalytics, toast])

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        export: 'csv',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })

      const response = await fetch(`/api/admin/exams/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `exams-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Success',
          description: 'Exams data exported successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to export data',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive'
      })
    }
  }, [filters, toast])

  // Loading screen
  if (status === 'loading' || (loading && exams.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Unauthorized screen
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exams Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all exams across schools</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchExams(pagination.currentPage)}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <ExamSummaryStats stats={summaryStats} />

        {/* Main Content with Tabs */}
        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Exam Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics & Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-6">
            {/* Filters */}
            <ExamFilters
              onFiltersChange={handleFiltersChange}
              schools={schools}
            />

            {/* Exams Table */}
            <ExamTable
              exams={exams}
              pagination={pagination}
              onPageChange={handlePageChange}
              onExamUpdated={() => {
                fetchExams(pagination.currentPage)
                fetchAnalytics()
              }}
              onBulkAction={handleBulkAction}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <ExamAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
