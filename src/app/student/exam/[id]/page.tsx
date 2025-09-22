'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Clock, Save, CheckCircle } from 'lucide-react'
import { useToast } from '../../../../hooks/use-toast'

interface Question {
  id: string
  text: string
  type: 'MCQ' | 'TRUE_FALSE' | 'ESSAY'
  options?: string[]
  points: number
}

interface Exam {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  is_live: boolean
  questions: Question[]
}

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [examId, setExamId] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin')
      return
    }

    const loadExam = async () => {
      const resolvedParams = await params
      setExamId(resolvedParams.id)
      fetchExam(resolvedParams.id)
    }
    loadExam()
  }, [session, status, router, params])

  useEffect(() => {
    if (exam && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [exam, timeLeft])

  const fetchExam = async (id: string) => {
    try {
      const response = await fetch(`/api/exams/${id}`)
      if (response.ok) {
        const examData = await response.json()
        
        // Check if exam is available for students
        const now = new Date()
        const startTime = new Date(examData.startTime)
        const endTime = new Date(examData.endTime)
        
        const isExamAvailable = examData.is_live || (now >= startTime && now <= endTime)
        
        if (!isExamAvailable) {
          toast({
            title: 'Exam Not Available',
            description: examData.is_live 
              ? 'This exam is currently offline.' 
              : `This exam is scheduled from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}.`,
            variant: 'destructive',
          })
          router.push('/student')
          return
        }
        
        setExam(examData)
        setTimeLeft(examData.duration * 60) // Convert minutes to seconds
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load exam',
          variant: 'destructive',
        })
        router.push('/student')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while loading the exam',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestion < exam!.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam submitted successfully!',
        })
        router.push('/student')
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit exam',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while submitting the exam',
        variant: 'destructive',
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Exam not found</p>
          <Button onClick={() => router.push('/student')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const question = exam.questions[currentQuestion]
  const isLastQuestion = currentQuestion === exam.questions.length - 1
  const isFirstQuestion = currentQuestion === 0

  return (
    <div className="min-h-screen bg-gray-50 exam-container no-select">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
                {exam.is_live && (
                  <Badge className="bg-red-600 text-white">🔴 LIVE</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">Question {currentQuestion + 1} of {exam.questions.length}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="exam-timer">
                <Clock className="h-4 w-4 inline mr-1" />
                {formatTime(timeLeft)}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/student')}
              >
                Exit Exam
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="exam-question">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Question {currentQuestion + 1} ({question.points} point{question.points !== 1 ? 's' : ''})
              </CardTitle>
              <Badge variant="outline">{question.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-lg">{question.text}</p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {question.type === 'MCQ' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'TRUE_FALSE' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'ESSAY' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Enter your answer here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={isFirstQuestion}
              >
                Previous
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Auto-save functionality
                    toast({
                      title: 'Saved',
                      description: 'Your answer has been saved',
                    })
                  }}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                
                {isLastQuestion ? (
                  <Button
                    onClick={handleSubmitExam}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Submit Exam
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Navigation */}
        <div className="exam-navigation">
          <div className="flex flex-wrap gap-2 justify-center">
            {exam.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[exam.questions[index].id]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
