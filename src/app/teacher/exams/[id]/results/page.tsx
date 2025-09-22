'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TeacherDashboardLayout } from '@/components/teacher/TeacherDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft,
  Download,
  Search,
  Filter,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BarChart3,
  Eye,
  FileText,
  Calendar,
  Timer,
  Target,
  RotateCcw
} from 'lucide-react'

interface ExamResult {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  studentClass: string
  regNumber: string
  score: number
  totalMarks: number
  percentage: number
  passed: boolean
  grade: string
  submittedAt: string
  timeSpent?: number
  attemptNumber: number
  objectiveScore: number
  subjectiveScore: number
  unansweredQuestions: number
  totalQuestions: number
  answers: Array<{
    questionId: string
    questionText: string
    questionType: string
    maxPoints: number
    studentAnswer: string
    correctAnswer: any
    pointsAwarded: number | null
    isCorrect: boolean | null
    submittedAt: string
  }>
}

interface ExamData {
  id: string
  title: string
  description?: string
  subject?: string
  class?: string
  totalMarks: number
  passingMarks?: number
  totalQuestions: number
  startTime: string
  endTime: string
  duration: number
}

interface Statistics {
  totalStudents: number
  passedStudents: number
  failedStudents: number
  passRate: number
  averageScore: number
  highestScore: number
  lowestScore: number
  averagePercentage: number
}

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [examId, setExamId] = useState<string | null>(null)
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [results, setResults] = useState<ExamResult[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<ExamResult | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchExamId = async () => {
      const { id } = await params
      setExamId(id)
    }
    fetchExamId()
  }, [params])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin')
      return
    }

    fetchExamResults()
  }, [session, status, router, examId])

  const fetchExamResults = async () => {
    if (!examId) return
    
    try {
      const response = await fetch(`/api/teacher/exams/${examId}/results`)
      
      if (response.ok) {
        const data = await response.json()
        setExamData(data.exam)
        setResults(data.results)
        setStatistics(data.statistics)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to fetch exam results',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching exam results',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = results.filter(result => {
    const matchesSearch = result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.studentClass.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'passed' && result.passed) ||
                         (filterStatus === 'failed' && !result.passed)
    
    return matchesSearch && matchesFilter
  })

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800'
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800'
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800'
      case 'D':
        return 'bg-orange-100 text-orange-800'
      case 'F':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExportResults = () => {
    // TODO: Implement CSV export functionality
    toast({
      title: 'Export Feature',
      description: 'CSV export functionality will be implemented soon',
    })
  }

  const handleResetAttempts = async () => {
    if (!examId) return
    
    if (!confirm('Are you sure you want to reset ALL student attempts for this exam? This will delete all attempts, answers, and results. This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/teacher/exams/${examId}/reset-attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetAll: true }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
        })
        // Refresh the results
        fetchExamResults()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to reset attempts',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while resetting attempts',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <TeacherDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exam results...</p>
          </div>
        </div>
      </TeacherDashboardLayout>
    )
  }

  if (!examData || !statistics) {
    return (
      <TeacherDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h2>
            <p className="text-gray-600 mb-6">This exam doesn't have any results yet.</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </TeacherDashboardLayout>
    )
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
              <p className="text-gray-600">{examData.title}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleResetAttempts} 
              variant="destructive"
              className="flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Attempts
            </Button>
            <Button onClick={handleExportResults} className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Exam Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Exam Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Subject</p>
                <p className="text-lg font-semibold">{examData.subject || 'General'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Class</p>
                <p className="text-lg font-semibold">{examData.class || 'All Classes'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Marks</p>
                <p className="text-lg font-semibold">{examData.totalMarks}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Questions</p>
                <p className="text-lg font-semibold">{examData.totalQuestions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold">{statistics.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Passed</p>
                  <p className="text-2xl font-bold">{statistics.passedStudents}</p>
                  <p className="text-sm text-gray-500">{statistics.passRate.toFixed(1)}% pass rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Average Score</p>
                  <p className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">{statistics.averagePercentage.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Highest Score</p>
                  <p className="text-2xl font-bold">{statistics.highestScore}</p>
                  <p className="text-sm text-gray-500">out of {examData.totalMarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Results</CardTitle>
                <CardDescription>
                  Detailed results for all students who took this exam
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.studentName}</p>
                        <p className="text-sm text-gray-500">{result.regNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>{result.studentClass}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.score}/{examData.totalMarks}</p>
                        <p className="text-sm text-gray-500">{result.percentage.toFixed(1)}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(result.grade)}>
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Passed
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Timer className="h-4 w-4 mr-1" />
                        {formatDuration(result.timeSpent)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateTime(result.submittedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedStudent(result)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Exam Details - {result.studentName}</DialogTitle>
                            <DialogDescription>
                              Detailed breakdown of answers and performance
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedStudent && (
                            <div className="space-y-6">
                              {/* Student Summary */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-600">{result.score}</p>
                                  <p className="text-sm text-gray-500">Total Score</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-green-600">{result.objectiveScore}</p>
                                  <p className="text-sm text-gray-500">Objective</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-purple-600">{result.subjectiveScore}</p>
                                  <p className="text-sm text-gray-500">Subjective</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-orange-600">{result.unansweredQuestions}</p>
                                  <p className="text-sm text-gray-500">Unanswered</p>
                                </div>
                              </div>

                              {/* Question-by-Question Breakdown */}
                              <div>
                                <h3 className="text-lg font-semibold mb-4">Question Breakdown</h3>
                                <div className="space-y-4">
                                  {result.answers.map((answer, index) => (
                                    <Card key={answer.questionId}>
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-medium">Question {index + 1}</h4>
                                          <div className="flex items-center space-x-2">
                                            <Badge variant="outline">{answer.questionType}</Badge>
                                            <Badge className={
                                              answer.pointsAwarded !== null ? 
                                                (answer.pointsAwarded === answer.maxPoints ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800') :
                                                'bg-gray-100 text-gray-800'
                                            }>
                                              {answer.pointsAwarded !== null ? 
                                                `${answer.pointsAwarded}/${answer.maxPoints}` : 
                                                'Not Graded'
                                              }
                                            </Badge>
                                          </div>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-3">{answer.questionText}</p>
                                        
                                        <div className="space-y-2">
                                          <div>
                                            <p className="text-sm font-medium text-gray-500">Student Answer:</p>
                                            <p className="text-sm bg-blue-50 p-2 rounded">
                                              {answer.studentAnswer || 'No answer provided'}
                                            </p>
                                          </div>
                                          
                                          {answer.questionType === 'ESSAY' || answer.questionType === 'SHORT_ANSWER' ? (
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Sample Answer:</p>
                                              <p className="text-sm bg-green-50 p-2 rounded">
                                                {typeof answer.correctAnswer === 'string' ? 
                                                  answer.correctAnswer : 
                                                  'Manual grading required'
                                                }
                                              </p>
                                            </div>
                                          ) : (
                                            <div>
                                              <p className="text-sm font-medium text-gray-500">Correct Answer:</p>
                                              <p className="text-sm bg-green-50 p-2 rounded">
                                                {typeof answer.correctAnswer === 'string' ? 
                                                  answer.correctAnswer : 
                                                  JSON.stringify(answer.correctAnswer)
                                                }
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TeacherDashboardLayout>
  )
}
