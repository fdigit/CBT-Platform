'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TeacherDashboardLayout } from '@/components/teacher/TeacherDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Clock,
  BookOpen,
  GraduationCap,
  Settings,
  HelpCircle
} from 'lucide-react'

interface Question {
  id: string
  text: string
  type: 'MCQ' | 'TRUE_FALSE' | 'ESSAY' | 'SHORT_ANSWER' | 'FILL_IN_BLANK' | 'MATCHING'
  options: string[]
  correctAnswer: string | string[]
  points: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  explanation?: string
  imageUrl?: string
  tags: string[]
}

interface ExamData {
  title: string
  description: string
  subjectId: string
  classId: string
  startTime: string
  endTime: string
  duration: number
  totalMarks: number
  passingMarks: number
  shuffle: boolean
  negativeMarking: boolean
  allowPreview: boolean
  showResultsImmediately: boolean
  maxAttempts: number
  assignmentType: 'CLASS_WIDE' | 'SPECIFIC_STUDENTS'
  assignedStudentIds: string[]
}

const questionTypes = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True/False' },
  { value: 'ESSAY', label: 'Essay' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'FILL_IN_BLANK', label: 'Fill in the Blank' },
  { value: 'MATCHING', label: 'Matching' }
]

const difficultyLevels = [
  { value: 'EASY', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HARD', label: 'Hard', color: 'bg-red-100 text-red-800' }
]

export default function EditExamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const { toast } = useToast()

  const [examData, setExamData] = useState<ExamData>({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    startTime: '',
    endTime: '',
    duration: 60,
    totalMarks: 0,
    passingMarks: 0,
    shuffle: false,
    negativeMarking: false,
    allowPreview: true,
    showResultsImmediately: false,
    maxAttempts: 1,
    assignmentType: 'CLASS_WIDE',
    assignedStudentIds: []
  })

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

    fetchSubjectsAndClasses()
    fetchExam()
  }, [session, status, router, examId])

  useEffect(() => {
    // Calculate total marks whenever questions change
    const totalMarks = questions.reduce((sum, q) => sum + q.points, 0)
    setExamData(prev => ({ ...prev, totalMarks }))
  }, [questions])

  const fetchSubjectsAndClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes-subjects')
      
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
        setClasses(data.classes || [])
      } else {
        console.error('Failed to fetch classes and subjects')
        setSubjects([])
        setClasses([])
      }
    } catch (error) {
      console.error('Error fetching subjects and classes:', error)
      setSubjects([])
      setClasses([])
    }
  }

  const fetchExam = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/exams/${examId}`)
      
      if (response.ok) {
        const data = await response.json()
        const exam = data.exam
        
        // Check if exam can be edited
        if (!['DRAFT', 'REJECTED'].includes(exam.status)) {
          toast({
            title: 'Cannot Edit',
            description: 'This exam cannot be edited in its current status',
            variant: 'destructive',
          })
          router.push(`/teacher/exams/${examId}`)
          return
        }

        // Populate form data
        setExamData({
          title: exam.title,
          description: exam.description || '',
          subjectId: exam.subject?.id || 'general',
          classId: exam.class?.id || 'all',
          startTime: new Date(exam.startTime).toISOString().slice(0, 16),
          endTime: new Date(exam.endTime).toISOString().slice(0, 16),
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks || 0,
          shuffle: exam.shuffle,
          negativeMarking: exam.negativeMarking,
          allowPreview: exam.allowPreview,
          showResultsImmediately: exam.showResultsImmediately,
          maxAttempts: exam.maxAttempts,
          assignmentType: exam.assignmentType || 'CLASS_WIDE',
          assignedStudentIds: exam.assignedStudentIds || []
        })

        // Populate questions
        setQuestions(exam.questions.map((q: any, index: number) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
          correctAnswer: q.correctAnswer || '',
          points: q.points,
          difficulty: q.difficulty || 'MEDIUM',
          explanation: q.explanation || '',
          imageUrl: q.imageUrl || '',
          tags: q.tags || []
        })))

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

  const handleInputChange = (field: keyof ExamData, value: any) => {
    setExamData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      difficulty: 'MEDIUM',
      explanation: '',
      tags: []
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...q.options, ''] }
        : q
    ))
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
          }
        : q
    ))
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.filter((_, idx) => idx !== optionIndex),
            correctAnswer: q.correctAnswer === optionIndex.toString() ? '' : q.correctAnswer
          }
        : q
    ))
  }

  const validateForm = () => {
    if (!examData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Exam title is required',
        variant: 'destructive',
      })
      return false
    }

    if (!examData.startTime || !examData.endTime) {
      toast({
        title: 'Validation Error',
        description: 'Start time and end time are required',
        variant: 'destructive',
      })
      return false
    }

    if (new Date(examData.startTime) >= new Date(examData.endTime)) {
      toast({
        title: 'Validation Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      })
      return false
    }

    if (questions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one question is required',
        variant: 'destructive',
      })
      return false
    }

    // Validate questions
    for (const question of questions) {
      if (!question.text.trim()) {
        toast({
          title: 'Validation Error',
          description: 'All questions must have text',
          variant: 'destructive',
        })
        return false
      }

      if (['MCQ', 'TRUE_FALSE'].includes(question.type)) {
        if (question.options.filter(opt => opt.trim()).length < 2) {
          toast({
            title: 'Validation Error',
            description: 'Multiple choice questions must have at least 2 options',
            variant: 'destructive',
          })
          return false
        }

        if (!question.correctAnswer) {
          toast({
            title: 'Validation Error',
            description: 'All multiple choice questions must have a correct answer',
            variant: 'destructive',
          })
          return false
        }
      }
    }

    return true
  }

  const saveExam = async () => {
    if (!validateForm()) return

    try {
      setSaving(true)
      
      const examPayload = {
        ...examData,
        questions: questions.map(({ id, ...question }) => ({
          ...question,
          // Remove the temporary ID for new questions
          ...(id.startsWith('temp-') ? {} : { id })
        }))
      }

      const response = await fetch(`/api/teacher/exams/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examPayload),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam updated successfully!',
        })
        router.push(`/teacher/exams/${examId}`)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to update exam',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while updating exam',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    const level = difficultyLevels.find(d => d.value === difficulty)
    return level ? (
      <Badge className={level.color}>{level.label}</Badge>
    ) : null
  }

  if (status === 'loading' || loading) {
    return (
      <TeacherDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exam...</p>
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
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Exam</h1>
              <p className="text-gray-600">Modify your examination</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={saveExam}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update the basic details for your exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter exam title"
                  value={examData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="60"
                  value={examData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter exam description"
                value={examData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={examData.subjectId} onValueChange={(value) => handleInputChange('subjectId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="class">Class</Label>
                <Select value={examData.classId} onValueChange={(value) => handleInputChange('classId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.displayName || `${cls.name}${cls.section ? ` ${cls.section}` : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Schedule
            </CardTitle>
            <CardDescription>
              Update the exam start and end times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={examData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={examData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              Grading
            </CardTitle>
            <CardDescription>
              Configure grading settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  value={examData.totalMarks}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Calculated from questions</p>
              </div>
              <div>
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  min="0"
                  max={examData.totalMarks}
                  value={examData.passingMarks}
                  onChange={(e) => handleInputChange('passingMarks', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  value={examData.maxAttempts}
                  onChange={(e) => handleInputChange('maxAttempts', parseInt(e.target.value) || 1)}
                />
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
            <CardDescription>
              Configure additional exam settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shuffle">Shuffle Questions</Label>
                  <p className="text-sm text-gray-500">Randomize question order for each student</p>
                </div>
                <Switch
                  id="shuffle"
                  checked={examData.shuffle}
                  onCheckedChange={(checked) => handleInputChange('shuffle', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="negativeMarking">Negative Marking</Label>
                  <p className="text-sm text-gray-500">Deduct marks for wrong answers</p>
                </div>
                <Switch
                  id="negativeMarking"
                  checked={examData.negativeMarking}
                  onCheckedChange={(checked) => handleInputChange('negativeMarking', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowPreview">Allow Preview</Label>
                  <p className="text-sm text-gray-500">Let students preview exam before starting</p>
                </div>
                <Switch
                  id="allowPreview"
                  checked={examData.allowPreview}
                  onCheckedChange={(checked) => handleInputChange('allowPreview', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showResultsImmediately">Show Results Immediately</Label>
                  <p className="text-sm text-gray-500">Display results right after submission</p>
                </div>
                <Switch
                  id="showResultsImmediately"
                  checked={examData.showResultsImmediately}
                  onCheckedChange={(checked) => handleInputChange('showResultsImmediately', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Questions ({questions.length})
                </CardTitle>
                <CardDescription>
                  Update questions for your exam
                </CardDescription>
              </div>
              <Button onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No questions added yet</p>
                <Button onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <Card key={question.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          {getDifficultyBadge(question.difficulty)}
                          <Badge variant="outline">{question.points} pts</Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Question Text *</Label>
                        <Textarea
                          placeholder="Enter your question here"
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Question Type</Label>
                          <Select 
                            value={question.type} 
                            onValueChange={(value) => updateQuestion(question.id, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Difficulty</Label>
                          <Select 
                            value={question.difficulty} 
                            onValueChange={(value) => updateQuestion(question.id, 'difficulty', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {difficultyLevels.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, 'points', parseFloat(e.target.value) || 1)}
                          />
                        </div>
                      </div>

                      {/* Options for MCQ and True/False */}
                      {['MCQ', 'TRUE_FALSE'].includes(question.type) && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Options</Label>
                            {question.type === 'MCQ' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(question.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Option
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <Input
                                  placeholder={`Option ${optionIndex + 1}`}
                                  value={option}
                                  onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                />
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={question.correctAnswer === optionIndex.toString()}
                                    onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex.toString())}
                                  />
                                  <span className="text-sm text-gray-500">Correct</span>
                                </div>
                                {question.type === 'MCQ' && question.options.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeOption(question.id, optionIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Correct Answer for other types */}
                      {!['MCQ', 'TRUE_FALSE'].includes(question.type) && (
                        <div>
                          <Label>Sample Answer/Keywords</Label>
                          <Textarea
                            placeholder="Enter sample answer or keywords for grading"
                            value={question.correctAnswer as string}
                            onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                          placeholder="Explain the correct answer"
                          value={question.explanation}
                          onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveExam}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </TeacherDashboardLayout>
  )
}
