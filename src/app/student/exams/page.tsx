'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StudentDashboardLayout } from '@/components/student/StudentDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Clock, 
  Users, 
  BookOpen,
  GraduationCap,
  Play,
  Eye,
  CheckCircle,
  AlertCircle,
  Trophy,
  Calendar,
  Search,
  Filter,
  Timer,
  Target,
  BarChart3
} from 'lucide-react'

interface Exam {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  totalMarks: number
  passingMarks?: number
  maxAttempts: number
  allowPreview: boolean
  showResultsImmediately: boolean
  examStatus: 'upcoming' | 'active' | 'completed'
  studentStatus: 'not_started' | 'in_progress' | 'submitted' | 'completed'
  canTake: boolean
  timeRemaining: number
  score?: number
  attemptCount: number
  totalQuestions: number
  subject?: {
    name: string
    code: string
  }
  class?: {
    name: string
    section?: string
  }
  teacherName: string
  questionTypes: Record<string, number>
}

interface Filters {
  status: string
  search: string
}

export default function StudentExams() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    status: 'available',
    search: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin')
      return
    }

    fetchExams()
  }, [session, status, router, filters])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        ...(filters.status !== 'available' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      })

      const response = await fetch(`/api/student/exams?${queryParams}`)
      
      if (response.ok) {
        const data = await response.json()
        setExams(data.exams || [])
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to fetch exams',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching exams',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getStatusBadge = (examStatus: string, studentStatus: string) => {
    if (studentStatus === 'completed') {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
    }
    
    if (studentStatus === 'in_progress') {
      return <Badge className="bg-blue-600"><Play className="h-3 w-3 mr-1" />In Progress</Badge>
    }
    
    if (studentStatus === 'submitted') {
      return <Badge className="bg-purple-600"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>
    }

    switch (examStatus) {
      case 'upcoming':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Calendar className="h-3 w-3 mr-1" />Upcoming</Badge>
      case 'active':
        return <Badge className="bg-green-600"><Play className="h-3 w-3 mr-1" />Active</Badge>
      case 'completed':
        return <Badge className="bg-gray-600"><CheckCircle className="h-3 w-3 mr-1" />Ended</Badge>
      default:
        return <Badge variant="outline">{examStatus}</Badge>
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const getActionButton = (exam: Exam) => {
    if (exam.studentStatus === 'in_progress') {
      return (
        <Button 
          onClick={() => router.push(`/student/exams/${exam.id}/take`)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Play className="h-4 w-4 mr-2" />
          Resume Exam
        </Button>
      )
    }

    if (exam.canTake) {
      return (
        <Button 
          onClick={() => router.push(`/student/exams/${exam.id}/take`)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Play className="h-4 w-4 mr-2" />
          {exam.attemptCount > 0 ? 'Retake Exam' : 'Start Exam'}
        </Button>
      )
    }

    if (exam.allowPreview && exam.examStatus === 'upcoming') {
      return (
        <Button 
          variant="outline"
          onClick={() => router.push(`/student/exams/${exam.id}/preview`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      )
    }

    if (exam.studentStatus === 'completed') {
      return (
        <Button 
          variant="outline"
          onClick={() => router.push(`/student/exams/${exam.id}/result`)}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Result
        </Button>
      )
    }

    return null
  }

  const getScoreDisplay = (exam: Exam) => {
    if (exam.score !== undefined && exam.score !== null) {
      const percentage = exam.totalMarks > 0 ? (exam.score / exam.totalMarks) * 100 : 0
      const passed = exam.passingMarks ? exam.score >= exam.passingMarks : null
      
      return (
        <div className="text-right">
          <div className="text-lg font-semibold">
            {exam.score}/{exam.totalMarks}
          </div>
          <div className="text-sm text-gray-600">
            {percentage.toFixed(1)}%
          </div>
          {passed !== null && (
            <Badge variant={passed ? "default" : "destructive"} className="mt-1">
              {passed ? "Passed" : "Failed"}
            </Badge>
          )}
        </div>
      )
    }
    return null
  }

  if (status === 'loading' || loading) {
    return (
      <StudentDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exams...</p>
          </div>
        </div>
      </StudentDashboardLayout>
    )
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Exams</h1>
            <p className="text-gray-600">View and take your assigned examinations</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search exams..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Exams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams List */}
        {exams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exams Available</h3>
                <p className="text-gray-600">
                  There are no exams available at the moment. Check back later for new assignments.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-xl">{exam.title}</CardTitle>
                        {getStatusBadge(exam.examStatus, exam.studentStatus)}
                      </div>
                      {exam.description && (
                        <CardDescription className="mb-2">{exam.description}</CardDescription>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-1" />
                          {exam.teacherName}
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {exam.subject?.name || 'General'}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {exam.class ? `${exam.class.name} ${exam.class.section || ''}` : 'All Classes'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Timer className="h-4 w-4 mr-1" />
                          {exam.duration} minutes
                        </div>
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          {exam.totalQuestions} questions • {exam.totalMarks} marks
                        </div>
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-1" />
                          Attempts: {exam.attemptCount}/{exam.maxAttempts}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getScoreDisplay(exam)}
                      {getActionButton(exam)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Schedule</p>
                      <p className="text-gray-600">Start: {formatDateTime(exam.startTime)}</p>
                      <p className="text-gray-600">End: {formatDateTime(exam.endTime)}</p>
                      {exam.examStatus === 'active' && exam.timeRemaining > 0 && (
                        <p className="text-red-600 font-medium">
                          Time left: {formatTimeRemaining(exam.timeRemaining)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Exam Details</p>
                      <p className="text-gray-600">Duration: {exam.duration} minutes</p>
                      {exam.passingMarks && (
                        <p className="text-gray-600">Passing: {exam.passingMarks} marks</p>
                      )}
                      <p className="text-gray-600">Max attempts: {exam.maxAttempts}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Question Types</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(exam.questionTypes).map(([type, count]) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {exam.examStatus === 'upcoming' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-800">
                          This exam will be available on {formatDateTime(exam.startTime)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentDashboardLayout>
  )
}