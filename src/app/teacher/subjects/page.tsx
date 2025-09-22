'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TeacherDashboardLayout } from '../../../components/teacher/TeacherDashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  ClipboardList,
  Trophy,
  BarChart3,
  FileText,
  MessageSquare,
} from 'lucide-react'

interface SubjectInfo {
  id: string
  name: string
  code: string
  totalClasses: number
  totalStudents: number
  averageScore: number
  completionRate: number
  upcomingLessons: number
  pendingAssignments: number
  classes: {
    id: string
    name: string
    section: string
    studentCount: number
    averageScore: number
  }[]
  recentActivities: {
    type: 'exam' | 'assignment' | 'lesson'
    title: string
    class: string
    date: string
    status: 'completed' | 'pending' | 'ongoing'
  }[]
}

export default function TeacherSubjects() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin')
      return
    }

    fetchTeacherSubjects()
  }, [session, status, router])

  const fetchTeacherSubjects = async () => {
    try {
      const response = await fetch('/api/teacher/subjects')
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects)
      } else {
        console.error('Failed to fetch teacher subjects')
        setSubjects([])
      }
    } catch (error) {
      console.error('Error fetching teacher subjects:', error)
      setSubjects([])
    }
  }

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getActivityStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>
      case 'ongoing':
        return <Badge variant="default" className="bg-blue-600">Ongoing</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <Trophy className="h-4 w-4" />
      case 'assignment':
        return <ClipboardList className="h-4 w-4" />
      case 'lesson':
        return <BookOpen className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
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

  if (!session || session.user.role !== 'TEACHER') {
    return null
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
            <p className="text-gray-600 mt-1">Manage subjects across all your classes</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Subject Analytics
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="high-performance">High Performance</SelectItem>
              <SelectItem value="needs-attention">Needs Attention</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subjects Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Code: {subject.code}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Subject Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{subject.totalClasses}</div>
                    <div className="text-sm text-blue-700">Classes</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{subject.totalStudents}</div>
                    <div className="text-sm text-green-700">Students</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(subject.averageScore)}`}>
                      {subject.averageScore}%
                    </div>
                    <div className="text-sm text-purple-700">Avg Score</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{subject.completionRate}%</div>
                    <div className="text-sm text-orange-700">Completion</div>
                  </div>
                </div>

                {/* Classes Teaching */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Classes Teaching</h4>
                  <div className="space-y-2">
                    {subject.classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{cls.name}{cls.section}</p>
                          <p className="text-sm text-gray-600">{cls.studentCount} students</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(cls.averageScore)}`}>
                            {cls.averageScore}%
                          </div>
                          <div className="text-xs text-gray-600">Avg Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Pending Tasks</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                      <Calendar className="h-4 w-4 text-yellow-600" />
                      <div>
                        <div className="text-sm font-medium text-yellow-900">
                          {subject.upcomingLessons} Lessons
                        </div>
                        <div className="text-xs text-yellow-700">This week</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                      <ClipboardList className="h-4 w-4 text-red-600" />
                      <div>
                        <div className="text-sm font-medium text-red-900">
                          {subject.pendingAssignments} Assignments
                        </div>
                        <div className="text-xs text-red-700">To grade</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activities</h4>
                  <div className="space-y-2">
                    {subject.recentActivities.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          {getActivityIcon(activity.type)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-600">{activity.class} • {activity.date}</p>
                          </div>
                        </div>
                        {getActivityStatusBadge(activity.status)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Trophy className="h-4 w-4 mr-1" />
                    Create Exam
                  </Button>
                  <Button variant="outline" size="sm">
                    <ClipboardList className="h-4 w-4 mr-1" />
                    Assignment
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Lesson Plan
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria.' : 'You don\'t have any subjects assigned yet.'}
            </p>
          </div>
        )}
      </div>
    </TeacherDashboardLayout>
  )
}
