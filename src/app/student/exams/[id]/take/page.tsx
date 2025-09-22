'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import { Input } from '../../../../../components/ui/input'
import { Textarea } from '../../../../../components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '../../../../../components/ui/radio-group'
import { Label } from '../../../../../components/ui/label'
import { Progress } from '../../../../../components/ui/progress'
import { useToast } from '../../../../../hooks/use-toast'
import { 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle,
  Save,
  Eye,
  EyeOff,
  Timer,
  Target,
  BookOpen
} from 'lucide-react'

interface Question {
  id: string
  text: string
  type: 'MCQ' | 'TRUE_FALSE' | 'ESSAY' | 'SHORT_ANSWER' | 'FILL_IN_BLANK' | 'MATCHING'
  options?: string[]
  points: number
  order: number
  imageUrl?: string
  audioUrl?: string
  videoUrl?: string
}

interface ExamData {
  id: string
  title: string
  description?: string
  duration: number
  totalMarks: number
  shuffle: boolean
  negativeMarking: boolean
  showResultsImmediately: boolean
  endTime: string
}

interface AttemptData {
  id: string
  attemptNumber: number
  startedAt: string
  status: string
}

interface Answer {
  questionId: string
  response: any
  isCorrect?: boolean
  pointsAwarded?: number
}

export default function TakeExamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exam, setExam] = useState<ExamData | null>(null)
  const [attempt, setAttempt] = useState<AttemptData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [showWarning, setShowWarning] = useState(false)

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1000
        if (newTime <= 0) {
          handleAutoSubmit()
          return 0
        }
        
        // Show warning when 5 minutes left
        if (newTime <= 5 * 60 * 1000 && !showWarning) {
          setShowWarning(true)
          toast({
            title: 'Time Warning',
            description: 'Only 5 minutes remaining!',
            variant: 'destructive',
          })
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, showWarning])

  // Auto-save effect
  useEffect(() => {
    if (!attempt || !questions.length) return

    const autoSaveTimer = setTimeout(() => {
      const currentQuestion = questions[currentQuestionIndex]
      if (currentQuestion && answers[currentQuestion.id]) {
        saveAnswer(currentQuestion.id, answers[currentQuestion.id], false)
      }
    }, 3000) // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [answers, currentQuestionIndex, attempt, questions])

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

    startExam()
  }, [session, status, router, examId])

  const startExam = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/exams/${examId}/start`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setExam(data.exam)
        setAttempt(data.attempt)
        setQuestions(data.questions)
        setTimeRemaining(data.timeRemaining)
        
        toast({
          title: 'Success',
          description: data.message,
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to start exam',
          variant: 'destructive',
        })
        router.push('/student/exams')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while starting exam',
        variant: 'destructive',
      })
      router.push('/student/exams')
    } finally {
      setLoading(false)
    }
  }

  const saveAnswer = async (questionId: string, response: any, showToast: boolean = true) => {
    if (!attempt) return

    try {
      setAutoSaveStatus('saving')
      const saveResponse = await fetch(`/api/student/exams/${examId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          response,
          attemptId: attempt.id
        }),
      })

      if (saveResponse.ok) {
        setAutoSaveStatus('saved')
        if (showToast) {
          toast({
            title: 'Answer Saved',
            description: 'Your answer has been saved successfully',
          })
        }
      } else {
        setAutoSaveStatus('error')
        if (showToast) {
          toast({
            title: 'Save Failed',
            description: 'Failed to save answer. Please try again.',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      setAutoSaveStatus('error')
      if (showToast) {
        toast({
          title: 'Save Error',
          description: 'An error occurred while saving answer',
          variant: 'destructive',
        })
      }
    }
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleAutoSubmit = async () => {
    if (!attempt || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/student/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: attempt.id,
          timeSpent: Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000)
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Exam Submitted',
          description: 'Your exam has been automatically submitted due to time expiry',
        })
        
        if (exam?.showResultsImmediately) {
          router.push(`/student/exams/${examId}/result`)
        } else {
          router.push('/student/exams')
        }
      } else {
        throw new Error('Submission failed')
      }
    } catch (error) {
      toast({
        title: 'Submission Error',
        description: 'Failed to submit exam. Please contact support.',
        variant: 'destructive',
      })
    }
  }

  const handleManualSubmit = async () => {
    if (!attempt || submitting) return

    const unansweredQuestions = questions.filter(q => !answers[q.id] || answers[q.id] === '').length
    
    if (unansweredQuestions > 0) {
      const confirm = window.confirm(
        `You have ${unansweredQuestions} unanswered questions. Are you sure you want to submit?`
      )
      if (!confirm) return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/student/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: attempt.id,
          timeSpent: Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000)
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Success',
          description: 'Exam submitted successfully!',
        })
        
        if (exam?.showResultsImmediately) {
          router.push(`/student/exams/${examId}/result`)
        } else {
          router.push('/student/exams')
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Submission failed')
      }
    } catch (error) {
      toast({
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'Failed to submit exam',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id]

    switch (question.type) {
      case 'MCQ':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={answer || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case 'TRUE_FALSE':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={answer || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${question.id}-true`} />
                <Label htmlFor={`${question.id}-true`} className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${question.id}-false`} />
                <Label htmlFor={`${question.id}-false`} className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          </div>
        )

      case 'SHORT_ANSWER':
        return (
          <Input
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            className="w-full"
          />
        )

      case 'ESSAY':
        return (
          <Textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your essay here..."
            className="w-full min-h-32"
            rows={6}
          />
        )

      case 'FILL_IN_BLANK':
        return (
          <Input
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Fill in the blank"
            className="w-full"
          />
        )

      default:
        return (
          <Textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            className="w-full"
            rows={4}
          />
        )
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!exam || !attempt || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Exam Not Available</h2>
          <p className="text-gray-600 mb-4">Unable to load exam data</p>
          <Button onClick={() => router.push('/student/exams')}>
            Back to Exams
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).filter(qId => answers[qId] !== '' && answers[qId] !== null && answers[qId] !== undefined).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {answeredCount}/{questions.length} answered
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4 text-gray-500" />
                <span className={`text-sm font-mono ${timeRemaining <= 5 * 60 * 1000 ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-600"></div>
                    <span className="text-xs">Saving...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Saved</span>
                  </div>
                )}
                {autoSaveStatus === 'error' && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">Error</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">
                  Question {currentQuestionIndex + 1}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <Badge variant="outline">{currentQuestion.type.replace('_', ' ')}</Badge>
                  <span>{currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Question Media */}
              {currentQuestion.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={currentQuestion.imageUrl} 
                    alt="Question image"
                    className="max-w-full h-auto rounded-md"
                  />
                </div>
              )}

              {/* Question Text */}
              <div className="prose max-w-none">
                <p className="text-lg text-gray-900 whitespace-pre-wrap">
                  {currentQuestion.text}
                </p>
              </div>

              {/* Answer Input */}
              <div className="mt-6">
                {renderQuestion(currentQuestion)}
              </div>

              {/* Manual Save Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => saveAnswer(currentQuestion.id, answers[currentQuestion.id])}
                  disabled={autoSaveStatus === 'saving'}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Answer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 ${
                  answers[questions[index].id] ? 'bg-green-100 border-green-300' : ''
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Time Warning Modal */}
      {timeRemaining <= 60 * 1000 && timeRemaining > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Time Almost Up!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Less than 1 minute remaining. Your exam will be automatically submitted when time expires.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWarning(false)}
                >
                  Continue
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
