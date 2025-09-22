'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TeacherDashboardLayout } from '../../../../components/teacher/TeacherDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { useToast } from '../../../../hooks/use-toast'
import { 
  ArrowLeft,
  Edit,
  Send,
  Trash2,
  Eye,
  Clock,
  Users,
  Target,
  BookOpen,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Settings,
  FileText
} from 'lucide-react'

interface ExamDetail {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  totalMarks: number
  passingMarks?: number
  shuffle: boolean
  negativeMarking: boolean
  allowPreview: boolean
  showResultsImmediately: boolean
  maxAttempts: number
  status: string
  dynamicStatus: string
  createdAt: string
  updatedAt?: string
  subject?: {
    name: string
    code: string
  }
  class?: {
    name: string
    section?: string
  }
  approver?: {
    name: string
  }
  questions: Array<{
    id: string
    text: string
    type: string
    points: number
    difficulty: string
    options?: any
    correctAnswer?: any
    explanation?: string
  }>
  studentsAttempted: number
  studentsCompleted: number
  averageScore: number
  questionsByType: Record<string, number>
  questionsByDifficulty: Record<string, number>
}

export default function TeacherExamDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<ExamDetail | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin')
      return
    }

    if (!examId) {
      router.push('/teacher/exams')
      return
    }

    fetchExam()
  }, [session, status, router, examId])

  const fetchExam = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/exams/${examId}`)
      
      if (response.ok) {
        const data = await response.json()
        setExam(data.exam)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to fetch exam details',
          variant: 'destructive',
        })
        router.push('/teacher/exams')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching exam details',
        variant: 'destructive',
      })
      router.push('/teacher/exams')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExam = async () => {
    if (!exam || !confirm(`Are you sure you want to delete "${exam.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/teacher/exams/${examId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam deleted successfully!',
        })
        router.push('/teacher/exams')
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete exam',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting exam',
        variant: 'destructive',
      })
    }
  }

  const handleSubmitForApproval = async () => {
    if (!exam || !confirm(`Submit "${exam.title}" for admin approval? You won't be able to edit it after submission.`)) {
      return
    }

    try {
      const response = await fetch(`/api/teacher/exams/${examId}/submit-for-approval`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam submitted for approval successfully!',
        })
        fetchExam() // Refresh to show updated status
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit exam for approval',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while submitting exam',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string, dynamicStatus?: string) => {
    const displayStatus = dynamicStatus || status
    
    switch (displayStatus) {
      case 'DRAFT':
        return <Badge variant="outline" className="text-gray-600"><Edit className="h-3 w-3 mr-1" />Draft</Badge>
      case 'PENDING_APPROVAL':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertCircle className="h-3 w-3 mr-1" />Pending Approval</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'PUBLISHED':
        return <Badge className="bg-blue-600"><Send className="h-3 w-3 mr-1" />Published</Badge>
      case 'SCHEDULED':
        return <Badge className="bg-purple-600"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>
      case 'ACTIVE':
        return <Badge className="bg-green-600"><Users className="h-3 w-3 mr-1" />Active</Badge>
      case 'COMPLETED':
        return <Badge className="bg-gray-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'CANCELLED':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="outline">{displayStatus}</Badge>
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const canEdit = (exam: ExamDetail) => {
    return ['DRAFT', 'REJECTED'].includes(exam.status)
  }

  const canDelete = (exam: ExamDetail) => {
    return ['DRAFT', 'REJECTED'].includes(exam.status) && exam.studentsAttempted === 0
  }

  const canSubmitForApproval = (exam: ExamDetail) => {
    return exam.status === 'DRAFT' && exam.questions.length > 0
  }

  if (status === 'loading' || loading) {
    return (
      <TeacherDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exam details...</p>
          </div>
        </div>
      </TeacherDashboardLayout>
    )
  }

  if (!exam) {
    return (
      <TeacherDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Exam Not Found</h2>
            <p className="text-gray-600 mb-4">The requested exam could not be found</p>
            <Button onClick={() => router.push('/teacher/exams')}>
              Back to Exams
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
              onClick={() => router.push('/teacher/exams')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-gray-600">Exam Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(exam.status, exam.dynamicStatus)}
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Title</p>
                  <p className="text-gray-900">{exam.title}</p>
                </div>
                {exam.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-gray-900">{exam.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Subject</p>
                  <p className="text-gray-900">{exam.subject?.name || 'General'} {exam.subject?.code ? `(${exam.subject.code})` : ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Class</p>
                  <p className="text-gray-900">{exam.class ? `${exam.class.name} ${exam.class.section || ''}` : 'All Classes'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-gray-900">{exam.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Marks</p>
                  <p className="text-gray-900">{exam.totalMarks} marks</p>
                </div>
                {exam.passingMarks && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Passing Marks</p>
                    <p className="text-gray-900">{exam.passingMarks} marks</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Max Attempts</p>
                  <p className="text-gray-900">{exam.maxAttempts}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Start Time</p>
                <p className="text-gray-900">{formatDateTime(exam.startTime)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">End Time</p>
                <p className="text-gray-900">{formatDateTime(exam.endTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Exam Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">Question Shuffling</span>
                <Badge variant={exam.shuffle ? "default" : "outline"}>
                  {exam.shuffle ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">Negative Marking</span>
                <Badge variant={exam.negativeMarking ? "destructive" : "outline"}>
                  {exam.negativeMarking ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">Allow Preview</span>
                <Badge variant={exam.allowPreview ? "default" : "outline"}>
                  {exam.allowPreview ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">Show Results Immediately</span>
                <Badge variant={exam.showResultsImmediately ? "default" : "outline"}>
                  {exam.showResultsImmediately ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{exam.questions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Students Attempted</p>
                  <p className="text-2xl font-bold text-gray-900">{exam.studentsAttempted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Students Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{exam.studentsCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {exam.averageScore ? `${exam.averageScore.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Questions ({exam.questions.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exam.questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge variant="outline">{question.type.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{question.difficulty}</Badge>
                      <span className="text-sm text-gray-600">{question.points} pts</span>
                    </div>
                  </div>
                  <p className="text-gray-900 mb-2">{question.text}</p>
                  {question.options && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">Options:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Array.isArray(question.options) ? 
                          question.options.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </div>
                          )) :
                          <div className="text-sm text-gray-700">Options available</div>
                        }
                      </div>
                    </div>
                  )}
                  {question.explanation && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">Explanation:</p>
                      <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          {canEdit(exam) && (
            <Button 
              variant="outline"
              onClick={() => router.push(`/teacher/exams/${examId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Exam
            </Button>
          )}

          {canSubmitForApproval(exam) && (
            <Button 
              onClick={handleSubmitForApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}

          {canDelete(exam) && (
            <Button 
              variant="destructive"
              onClick={handleDeleteExam}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Exam
            </Button>
          )}
        </div>

        {/* Rejection Notice */}
        {exam.status === 'REJECTED' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                Exam Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                This exam was rejected by the school admin. Please review the feedback, make necessary changes, and resubmit.
              </p>
              {exam.approver && (
                <p className="text-sm text-red-600 mt-2">
                  Reviewed by: {exam.approver.name}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherDashboardLayout>
  )
}
