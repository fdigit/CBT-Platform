'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StudentDashboardLayout } from '../../../../../components/student/StudentDashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import { Progress } from '../../../../../components/ui/progress'
import { useToast } from '../../../../../hooks/use-toast'
import { 
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  BookOpen,
  Award,
  TrendingUp,
  FileText
} from 'lucide-react'

interface ExamResult {
  id: string
  title: string
  description?: string
  duration: number
  totalMarks: number
  passingMarks?: number
  subject?: {
    name: string
    code: string
  }
  teacher?: {
    user: {
      name: string
    }
  }
  result: {
    score: number
    percentage: number
    passed?: boolean
    gradedAt: string
  }
  attempt: {
    attemptNumber: number
    startedAt: string
    submittedAt: string
    timeSpent: number
    status: string
  }
  statistics: {
    totalQuestions: number
    answeredQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    unansweredQuestions: number
    objectiveScore: number
    subjectiveQuestions: number
  }
  answerBreakdown?: Array<{
    questionId: string
    questionText: string
    questionType: string
    response: any
    isCorrect?: boolean
    pointsAwarded: number
    maxPoints: number
    explanation?: string
  }>
}

export default function ExamResultPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<ExamResult | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin')
      return
    }

    if (!examId) {
      router.push('/student/exams')
      return
    }

    fetchResult()
  }, [session, status, router, examId])

  const fetchResult = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/exams/${examId}/result`)
      
      if (response.ok) {
        const data = await response.json()
        setResult(data.result)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to fetch result',
          variant: 'destructive',
        })
        router.push('/student/exams')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching result',
        variant: 'destructive',
      })
      router.push('/student/exams')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else {
      return `${minutes}m ${remainingSeconds}s`
    }
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const getPerformanceMessage = (percentage: number, passed?: boolean) => {
    if (passed === false) {
      return "You didn't meet the passing requirements. Keep studying and try again!"
    }
    
    if (percentage >= 90) {
      return "Excellent work! Outstanding performance!"
    } else if (percentage >= 80) {
      return "Great job! Very good performance!"
    } else if (percentage >= 70) {
      return "Good work! Solid performance!"
    } else if (percentage >= 60) {
      return "Fair performance. There's room for improvement!"
    } else {
      return "Keep studying and practicing. You can do better!"
    }
  }

  if (status === 'loading' || loading) {
    return (
      <StudentDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading result...</p>
          </div>
        </div>
      </StudentDashboardLayout>
    )
  }

  if (!result) {
    return (
      <StudentDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Result Not Available</h2>
            <p className="text-gray-600 mb-4">Unable to load exam result</p>
            <Button onClick={() => router.push('/student/exams')}>
              Back to Exams
            </Button>
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
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/student/exams')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam Result</h1>
              <p className="text-gray-600">{result.title}</p>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getGradeColor(result.result.percentage)}`}>
                  {result.result.score}/{result.totalMarks}
                </div>
                <div className={`text-2xl font-semibold ${getGradeColor(result.result.percentage)}`}>
                  {result.result.percentage.toFixed(1)}%
                </div>
                <div className={`text-3xl font-bold ${getGradeColor(result.result.percentage)} mt-2`}>
                  Grade: {getGradeLetter(result.result.percentage)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col justify-center">
                <Progress value={result.result.percentage} className="h-4 mb-2" />
                <p className="text-sm text-gray-600 text-center">
                  {getPerformanceMessage(result.result.percentage, result.result.passed)}
                </p>
              </div>

              {/* Pass/Fail Status */}
              <div className="text-center">
                {result.result.passed !== undefined && (
                  <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                    result.result.passed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.result.passed ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    {result.result.passed ? 'PASSED' : 'FAILED'}
                  </div>
                )}
                {result.passingMarks && (
                  <p className="text-sm text-gray-600 mt-2">
                    Passing marks: {result.passingMarks}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.statistics.answeredQuestions}/{result.statistics.totalQuestions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Correct Answers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.statistics.correctAnswers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Incorrect Answers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.statistics.incorrectAnswers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Taken</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(result.attempt.timeSpent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Exam Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subject</p>
                  <p className="text-gray-900">{result.subject?.name || 'General'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Teacher</p>
                  <p className="text-gray-900">{result.teacher?.user?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Attempt Number</p>
                  <p className="text-gray-900">{result.attempt.attemptNumber}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Started At</p>
                  <p className="text-gray-900">{new Date(result.attempt.startedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted At</p>
                  <p className="text-gray-900">{new Date(result.attempt.submittedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration Allowed</p>
                  <p className="text-gray-900">{result.duration} minutes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer Breakdown */}
        {result.answerBreakdown && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Answer Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.answerBreakdown.map((answer, index) => (
                  <div key={answer.questionId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <Badge variant="outline">{answer.questionType.replace('_', ' ')}</Badge>
                          <span className="text-sm text-gray-600">
                            {answer.pointsAwarded}/{answer.maxPoints} points
                          </span>
                        </div>
                        <p className="text-gray-900 mb-2">{answer.questionText}</p>
                      </div>
                      <div className="ml-4">
                        {answer.isCorrect === true && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {answer.isCorrect === false && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {answer.isCorrect === null && (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 mb-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                      <p className="text-gray-900">
                        {typeof answer.response === 'string' 
                          ? answer.response 
                          : JSON.stringify(answer.response)
                        }
                      </p>
                    </div>

                    {answer.explanation && (
                      <div className="bg-blue-50 rounded p-3">
                        <p className="text-sm font-medium text-blue-600 mb-1">Explanation:</p>
                        <p className="text-blue-900 text-sm">{answer.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/student/exams')}
          >
            Back to Exams
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Print Result
          </Button>
        </div>
      </div>
    </StudentDashboardLayout>
  )
}
