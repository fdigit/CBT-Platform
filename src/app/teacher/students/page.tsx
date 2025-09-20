'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TeacherDashboardLayout } from '@/components/teacher/TeacherDashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Search,
  Filter,
  Eye,
  MessageSquare,
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'

interface StudentInfo {
  id: string
  name: string
  regNumber: string
  email: string
  phone?: string
  avatar?: string
  class: string
  subjects: string[]
  status: 'active' | 'inactive' | 'suspended'
  
  // Academic Performance
  currentGPA: number
  averageScore: number
  totalExams: number
  completedAssignments: number
  pendingAssignments: number
  
  // Attendance
  attendanceRate: number
  presentDays: number
  absentDays: number
  lateDays: number
  
  // Parent/Guardian Info
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  
  // Recent Activity
  lastLogin?: string
  lastExamTaken?: string
  recentGrades: {
    subject: string
    score: number
    date: string
    type: 'exam' | 'assignment' | 'quiz'
  }[]
}

interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  subject: string
  notes?: string
}

export default function TeacherStudents() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin')
      return
    }

    fetchStudents()
    fetchAttendanceRecords()
  }, [session, status, router])

  const fetchStudents = async () => {
    // Mock data - replace with actual API call
    setStudents([
      {
        id: '1',
        name: 'John Doe',
        regNumber: 'SS2A/001',
        email: 'john.doe@student.com',
        phone: '0801234567',
        class: 'SS 2A',
        subjects: ['Mathematics', 'Physics'],
        status: 'active',
        currentGPA: 3.8,
        averageScore: 85.5,
        totalExams: 12,
        completedAssignments: 18,
        pendingAssignments: 2,
        attendanceRate: 95.2,
        presentDays: 89,
        absentDays: 4,
        lateDays: 1,
        parentName: 'Jane Doe',
        parentPhone: '0807654321',
        parentEmail: 'jane.doe@parent.com',
        lastLogin: '2 hours ago',
        lastExamTaken: '1 day ago',
        recentGrades: [
          { subject: 'Mathematics', score: 88, date: '2024-01-20', type: 'exam' },
          { subject: 'Physics', score: 82, date: '2024-01-18', type: 'assignment' },
          { subject: 'Mathematics', score: 90, date: '2024-01-15', type: 'quiz' },
        ]
      },
      {
        id: '2',
        name: 'Jane Smith',
        regNumber: 'SS2A/002',
        email: 'jane.smith@student.com',
        class: 'SS 2A',
        subjects: ['Mathematics', 'Physics'],
        status: 'active',
        currentGPA: 4.0,
        averageScore: 92.3,
        totalExams: 12,
        completedAssignments: 20,
        pendingAssignments: 0,
        attendanceRate: 98.1,
        presentDays: 92,
        absentDays: 1,
        lateDays: 1,
        parentName: 'Robert Smith',
        parentPhone: '0809876543',
        parentEmail: 'robert.smith@parent.com',
        lastLogin: '30 minutes ago',
        lastExamTaken: '3 hours ago',
        recentGrades: [
          { subject: 'Mathematics', score: 95, date: '2024-01-20', type: 'exam' },
          { subject: 'Physics', score: 89, date: '2024-01-18', type: 'assignment' },
          { subject: 'Mathematics', score: 93, date: '2024-01-15', type: 'quiz' },
        ]
      },
      {
        id: '3',
        name: 'Mike Johnson',
        regNumber: 'SS1B/001',
        email: 'mike.johnson@student.com',
        class: 'SS 1B',
        subjects: ['Physics'],
        status: 'active',
        currentGPA: 3.2,
        averageScore: 76.8,
        totalExams: 10,
        completedAssignments: 14,
        pendingAssignments: 3,
        attendanceRate: 87.5,
        presentDays: 75,
        absentDays: 8,
        lateDays: 3,
        parentName: 'Lisa Johnson',
        parentPhone: '0803456789',
        parentEmail: 'lisa.johnson@parent.com',
        lastLogin: '1 day ago',
        lastExamTaken: '2 days ago',
        recentGrades: [
          { subject: 'Physics', score: 78, date: '2024-01-19', type: 'exam' },
          { subject: 'Physics', score: 75, date: '2024-01-17', type: 'assignment' },
          { subject: 'Physics', score: 80, date: '2024-01-14', type: 'quiz' },
        ]
      },
      {
        id: '4',
        name: 'Sarah Wilson',
        regNumber: 'SS1B/002',
        email: 'sarah.wilson@student.com',
        class: 'SS 1B',
        subjects: ['Physics'],
        status: 'active',
        currentGPA: 3.9,
        averageScore: 89.2,
        totalExams: 10,
        completedAssignments: 16,
        pendingAssignments: 1,
        attendanceRate: 96.7,
        presentDays: 88,
        absentDays: 2,
        lateDays: 1,
        parentName: 'David Wilson',
        parentPhone: '0805432109',
        parentEmail: 'david.wilson@parent.com',
        lastLogin: '4 hours ago',
        lastExamTaken: '1 day ago',
        recentGrades: [
          { subject: 'Physics', score: 92, date: '2024-01-19', type: 'exam' },
          { subject: 'Physics', score: 87, date: '2024-01-17', type: 'assignment' },
          { subject: 'Physics', score: 91, date: '2024-01-14', type: 'quiz' },
        ]
      }
    ])
  }

  const fetchAttendanceRecords = async () => {
    // Mock data - replace with actual API call
    setAttendanceRecords([
      {
        id: '1',
        studentId: '1',
        date: '2024-01-22',
        status: 'present',
        subject: 'Mathematics',
      },
      {
        id: '2',
        studentId: '2',
        date: '2024-01-22',
        status: 'present',
        subject: 'Mathematics',
      },
      {
        id: '3',
        studentId: '3',
        date: '2024-01-22',
        status: 'late',
        subject: 'Physics',
        notes: 'Arrived 10 minutes late'
      },
    ])
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.regNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = filterClass === 'all' || student.class === filterClass
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus
    return matchesSearch && matchesClass && matchesStatus
  })

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'gpa':
        return b.currentGPA - a.currentGPA
      case 'attendance':
        return b.attendanceRate - a.attendanceRate
      case 'average':
        return b.averageScore - a.averageScore
      default:
        return 0
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-600">Present</Badge>
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>
      case 'late':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Late</Badge>
      case 'excused':
        return <Badge variant="secondary">Excused</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (score: number, previousScore?: number) => {
    if (!previousScore) return null
    if (score > previousScore) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (score < previousScore) return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
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
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 mt-1">View student lists, attendance, and performance across your classes</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Take Attendance
            </Button>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Class Analytics
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Need Attention</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.filter(s => s.averageScore < 70 || s.attendanceRate < 85).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name, reg number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="SS 1A">SS 1A</SelectItem>
              <SelectItem value="SS 1B">SS 1B</SelectItem>
              <SelectItem value="SS 2A">SS 2A</SelectItem>
              <SelectItem value="SS 2B">SS 2B</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="gpa">Sort by GPA</SelectItem>
              <SelectItem value="attendance">Sort by Attendance</SelectItem>
              <SelectItem value="average">Sort by Average</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.regNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className={`font-medium ${getGradeColor(student.currentGPA * 25)}`}>
                          {student.currentGPA.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className={`font-medium ${getGradeColor(student.averageScore)}`}>
                          {student.averageScore.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className={student.attendanceRate >= 90 ? 'text-green-600' : student.attendanceRate >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                          {student.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {student.lastLogin}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student)
                            setIsProfileModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Student Profile Modal */}
        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedStudent && (
              <>
                <DialogHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStudent.avatar} alt={selectedStudent.name} />
                      <AvatarFallback className="text-lg">
                        {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl">{selectedStudent.name}</DialogTitle>
                      <DialogDescription className="text-lg">
                        {selectedStudent.regNumber} • {selectedStudent.class}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="grades">Grades</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Performance Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedStudent.currentGPA.toFixed(1)}</div>
                          <div className="text-sm text-gray-600">Current GPA</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className={`text-2xl font-bold ${getGradeColor(selectedStudent.averageScore)}`}>
                            {selectedStudent.averageScore.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Average Score</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedStudent.attendanceRate.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Attendance</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{selectedStudent.completedAssignments}</div>
                          <div className="text-sm text-gray-600">Assignments</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Last Login</span>
                            <span className="text-sm font-medium">{selectedStudent.lastLogin}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Last Exam Taken</span>
                            <span className="text-sm font-medium">{selectedStudent.lastExamTaken}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Pending Assignments</span>
                            <Badge variant={selectedStudent.pendingAssignments > 0 ? "destructive" : "default"}>
                              {selectedStudent.pendingAssignments}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="grades" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Grades</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedStudent.recentGrades.map((grade, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{grade.subject}</p>
                                <p className="text-sm text-gray-600 capitalize">{grade.type} • {grade.date}</p>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${getGradeColor(grade.score)}`}>
                                  {grade.score}%
                                </div>
                                {getPerformanceIcon(grade.score, selectedStudent.recentGrades[index + 1]?.score)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="attendance" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedStudent.presentDays}</div>
                          <div className="text-sm text-gray-600">Present Days</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">{selectedStudent.absentDays}</div>
                          <div className="text-sm text-gray-600">Absent Days</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{selectedStudent.lateDays}</div>
                          <div className="text-sm text-gray-600">Late Days</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Student Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{selectedStudent.email}</span>
                          </div>
                          {selectedStudent.phone && (
                            <div className="flex items-center space-x-3">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{selectedStudent.phone}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {selectedStudent.parentName && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Parent/Guardian</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{selectedStudent.parentName}</span>
                            </div>
                            {selectedStudent.parentEmail && (
                              <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{selectedStudent.parentEmail}</span>
                              </div>
                            )}
                            {selectedStudent.parentPhone && (
                              <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{selectedStudent.parentPhone}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {sortedStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No students are assigned to your classes yet.'}
            </p>
          </div>
        )}
      </div>
    </TeacherDashboardLayout>
  )
}
