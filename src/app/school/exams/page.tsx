'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SchoolDashboardLayout } from '../../../components/school/SchoolDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { useToast } from '../../../hooks/use-toast'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Send, 
  BookOpen, 
  GraduationCap 
} from 'lucide-react'

interface Exam {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  shuffle: boolean
  negativeMarking: boolean
  status: string
  dynamicStatus: string
  createdAt: string
  totalMarks: number
  studentsAttempted: number
  studentsCompleted: number
  teacherName: string
  subjectName: string
  className: string
  approverName?: string
  manualControl?: boolean
  isLive?: boolean
  isCompleted?: boolean
  teacher?: {
    user: {
      name: string
    }
  }
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
  }>
  _count: {
    results: number
    answers: number
    attempts: number
  }
}

export default function ExamsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchExams()
  }, [session, status, router])

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/admin/exams')
      if (response.ok) {
        const data = await response.json()
        setExams(data.exams || [])
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch exams',
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

  const handleApproveExam = async (examId: string, examTitle: string, publishNow: boolean = false) => {
    const action = publishNow ? 'approve and publish' : 'approve'
    if (!confirm(`Are you sure you want to ${action} "${examTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/exams/${examId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'approve',
          publishNow 
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Exam ${action}d successfully!`,
        })
        fetchExams()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || `Failed to ${action} exam`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `An error occurred while ${action}ing exam`,
        variant: 'destructive',
      })
    }
  }

  const handleRejectExam = async (examId: string, examTitle: string) => {
    const rejectionReason = prompt(`Please provide a reason for rejecting "${examTitle}":`)
    if (!rejectionReason) return

    try {
      const response = await fetch(`/api/admin/exams/${examId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reject',
          rejectionReason 
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam rejected successfully!',
        })
        fetchExams()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to reject exam',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while rejecting exam',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam deleted successfully!',
        })
        fetchExams()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete exam',
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

  const handleManualControl = async (examId: string, action: string, examTitle: string) => {
    const actionText = action === 'make_live' ? 'make live' : 
                      action === 'make_completed' ? 'mark as completed' : 
                      'toggle manual control'
    
    if (!confirm(`Are you sure you want to ${actionText} "${examTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/school/exams/${examId}/manual-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action,
          enableManualControl: action === 'toggle_manual_control' ? true : undefined
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Exam ${actionText}d successfully!`,
        })
        fetchExams()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || `Failed to ${actionText} exam`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `An error occurred while ${actionText}ing exam`,
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

  if (status === 'loading' || loading) {
    return (
      <SchoolDashboardLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
      </SchoolDashboardLayout>
    )
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Exams</h1>
            <p className="text-gray-600">Review and approve teacher examinations</p>
          </div>
          <Button 
            onClick={() => router.push('/school/exams/create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Exam
          </Button>
        </div>

        {/* Exams List */}
        {exams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exams Yet</h3>
                <p className="text-gray-600 mb-6">
                  Teachers haven't created any exams yet, or create your own exam
                </p>
                <Button 
                  onClick={() => router.push('/school/exams/create')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Exam
                </Button>
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
                        {getStatusBadge(exam.status, exam.dynamicStatus)}
                        {exam.manualControl && (
                          <Badge variant="outline" className="border-purple-600 text-purple-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Manual Control
                          </Badge>
                        )}
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
                          {exam.subjectName}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {exam.className}
                        </div>
                      </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {exam.duration} minutes
                          </div>
                        <div>
                          {exam.questions?.length || 0} questions • {exam.totalMarks} marks
                          </div>
                          <div>
                          {exam.studentsCompleted} completed
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/school/exams/${exam.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      
                      {exam.status === 'PENDING_APPROVAL' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleApproveExam(exam.id, exam.title)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleApproveExam(exam.id, exam.title, true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Approve & Publish
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRejectExam(exam.id, exam.title)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {['DRAFT', 'REJECTED'].includes(exam.status) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/school/exams/${exam.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}

                      {['DRAFT', 'REJECTED'].includes(exam.status) && exam.studentsAttempted === 0 && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteExam(exam.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}

                      {/* Manual Control Buttons for Published/Approved Exams */}
                      {['PUBLISHED', 'APPROVED'].includes(exam.status) && (
                        <>
                          {!exam.manualControl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleManualControl(exam.id, 'toggle_manual_control', exam.title)}
                              className="border-purple-600 text-purple-600 hover:bg-purple-50"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Enable Manual Control
                            </Button>
                          )}
                          
                          {exam.manualControl && (
                            <>
                              {!exam.isLive && !exam.isCompleted && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleManualControl(exam.id, 'make_live', exam.title)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  Make Live
                                </Button>
                              )}
                              
                              {exam.isLive && !exam.isCompleted && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleManualControl(exam.id, 'make_completed', exam.title)}
                                  className="bg-gray-600 hover:bg-gray-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Completed
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleManualControl(exam.id, 'toggle_manual_control', exam.title)}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Disable Manual Control
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Start Time</p>
                        <p className="text-gray-600">{formatDateTime(exam.startTime)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">End Time</p>
                        <p className="text-gray-600">{formatDateTime(exam.endTime)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Settings</p>
                      <div className="flex space-x-2">
                          {exam.shuffle && <Badge variant="outline">Shuffled</Badge>}
                          {exam.negativeMarking && <Badge variant="outline">Negative Marking</Badge>}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Created</p>
                        <p className="text-gray-600">{formatDateTime(exam.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        )}
      </div>
    </SchoolDashboardLayout>
  )
}
