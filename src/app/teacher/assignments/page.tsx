'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TeacherDashboardLayout } from '@/components/teacher/TeacherDashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Download,
  Upload,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Send,
  Trash2,
  BarChart3,
  MessageSquare,
  BookOpen,
  StickyNote,
  Package,
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  subject: string | { name: string; code?: string } | null
  class: string | { name: string; section?: string } | null
  description: string
  instructions: string
  dueDate: string
  createdAt: string
  status: 'draft' | 'published' | 'closed' | 'archived'
  type: 'assignment' | 'note' | 'resource' | 'homework' | 'project' | 'quiz' | 'test'
  maxScore: number
  attachments: {
    id: string
    name: string
    url: string
    size: string
  }[]
  submissions: {
    total: number
    submitted: number
    graded: number
    pending: number
  }
  averageScore?: number
}

interface Submission {
  id: string
  assignmentId: string
  studentId: string
  studentName: string
  studentAvatar?: string
  submittedAt: string
  status: 'submitted' | 'graded' | 'late' | 'missing'
  score?: number
  feedback?: string
  attachments: {
    id: string
    name: string
    url: string
  }[]
}

export default function TeacherAssignments() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSubject, setFilterSubject] = useState('all')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('assignments')

  // New assignment form state
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: 'general',
    class: 'all',
    description: '',
    instructions: '',
    dueDate: '',
    type: 'assignment' as 'assignment' | 'note' | 'resource' | 'homework' | 'project' | 'quiz' | 'test',
    maxScore: 100,
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin')
      return
    }

    fetchAssignments()
    fetchSubmissions()
    fetchTeacherData()
  }, [session, status, router])

  const fetchTeacherData = async () => {
    try {
      setLoadingData(true)
      const [subjectsResponse, classesResponse] = await Promise.all([
        fetch('/api/teacher/subjects'),
        fetch('/api/teacher/school-classes') // Fetch all school classes via teacher endpoint
      ])

      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setSubjects(subjectsData.subjects || [])
      }

      if (classesResponse.ok) {
        const classesData = await classesResponse.json()
        setClasses(classesData.classes || [])
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/teacher/assignments')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched assignments:', data.assignments)
        setAssignments(data.assignments || [])
      } else {
        console.error('Failed to fetch assignments:', response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        // Fallback to empty array if API fails
        setAssignments([])
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      // Fallback to empty array if API fails
      setAssignments([])
    }
  }

  const fetchSubmissions = async () => {
    // Mock data - replace with actual API call
    setSubmissions([
      {
        id: '1',
        assignmentId: '1',
        studentId: '1',
        studentName: 'John Doe',
        submittedAt: '2024-01-24T10:30:00Z',
        status: 'graded',
        score: 45,
        feedback: 'Good work! Minor error in problem 3.',
        attachments: [
          {
            id: '1',
            name: 'John_Quadratic_Solutions.pdf',
            url: '/submissions/john-quadratic.pdf'
          }
        ]
      },
      {
        id: '2',
        assignmentId: '1',
        studentId: '2',
        studentName: 'Jane Smith',
        submittedAt: '2024-01-23T15:45:00Z',
        status: 'submitted',
        attachments: [
          {
            id: '2',
            name: 'Jane_Math_Assignment.pdf',
            url: '/submissions/jane-math.pdf'
          }
        ]
      },
      {
        id: '3',
        assignmentId: '2',
        studentId: '3',
        studentName: 'Mike Johnson',
        submittedAt: '2024-01-27T09:15:00Z',
        status: 'late',
        attachments: [
          {
            id: '3',
            name: 'Mike_Lab_Report.docx',
            url: '/submissions/mike-lab-report.docx'
          }
        ]
      }
    ])
  }

  const filteredAssignments = assignments.filter(assignment => {
    const subjectName = typeof assignment.subject === 'string' ? assignment.subject : assignment.subject?.name || 'General'
    const className = typeof assignment.class === 'string' ? assignment.class : assignment.class ? `${assignment.class.name}${assignment.class.section ? ` ${assignment.class.section}` : ''}` : 'All Classes'
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         className.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus
    const matchesSubject = filterSubject === 'all' || subjectName === filterSubject
    return matchesSearch && matchesStatus && matchesSubject
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-600">Published</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Draft</Badge>
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      assignment: 'bg-blue-100 text-blue-800',
      note: 'bg-green-100 text-green-800',
      resource: 'bg-orange-100 text-orange-800',
      homework: 'bg-blue-100 text-blue-800',
      project: 'bg-purple-100 text-purple-800',
      quiz: 'bg-yellow-100 text-yellow-800',
      test: 'bg-red-100 text-red-800'
    }
    return <Badge className={colors[type as keyof typeof colors]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      assignment: ClipboardList,
      note: StickyNote,
      resource: Package,
      homework: BookOpen,
      project: FileText,
      quiz: AlertCircle,
      test: CheckCircle
    }
    const Icon = icons[type as keyof typeof icons] || ClipboardList
    return <Icon className="h-4 w-4" />
  }

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge variant="default" className="bg-green-600">Graded</Badge>
      case 'submitted':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Submitted</Badge>
      case 'late':
        return <Badge variant="destructive">Late</Badge>
      case 'missing':
        return <Badge variant="outline" className="text-red-600 border-red-600">Missing</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleCreateAssignment = async (status: 'draft' | 'published' = 'published') => {
    try {
      // First create the assignment
      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newAssignment.title,
          description: newAssignment.description,
          instructions: newAssignment.instructions,
          type: newAssignment.type.toUpperCase(),
          dueDate: newAssignment.dueDate || null,
          maxScore: newAssignment.maxScore,
          status: status.toUpperCase(),
          classId: newAssignment.class === 'all' ? null : newAssignment.class,
          subjectId: newAssignment.subject === 'general' ? null : newAssignment.subject,
          attachments: uploadedFiles.map(file => ({
            fileName: file.id,
            originalName: file.name,
            filePath: file.url,
            fileSize: file.size,
            mimeType: file.type,
          }))
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create assignment')
      }

      const { assignment } = await response.json()

      // Upload files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          // Files are already uploaded via the FileUpload component
          // We just need to associate them with the assignment
          // This would be handled by updating the upload endpoint or 
          // implementing a separate association API
        }
      }

      // Add to local state for immediate UI update
      const createdAssignment: Assignment = {
        id: assignment.id,
        title: assignment.title,
        subject: assignment.subject?.name || 'General',
        class: assignment.class ? `${assignment.class.name}${assignment.class.section ? ` ${assignment.class.section}` : ''}` : 'All Classes',
        description: assignment.description || '',
        instructions: assignment.instructions || '',
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
        createdAt: new Date(assignment.createdAt).toISOString().split('T')[0],
        status: assignment.status.toLowerCase() as any,
        type: assignment.type.toLowerCase() as any,
        maxScore: assignment.maxScore,
        attachments: uploadedFiles.map(file => ({
          id: file.id || '',
          name: file.name,
          url: file.url,
          size: `${Math.round(file.size / 1024)} KB`
        })),
      submissions: {
        total: 0,
        submitted: 0,
        graded: 0,
        pending: 0
        }
    }
    
      setAssignments([createdAssignment, ...assignments])
    setIsCreateModalOpen(false)
    
    // Reset form
    setNewAssignment({
      title: '',
        subject: 'general',
        class: 'all',
      description: '',
      instructions: '',
      dueDate: '',
        type: 'assignment',
      maxScore: 100,
    })
      setUploadedFiles([])

      // Refresh assignments list to ensure we have the latest data
      await fetchAssignments()

      // Show success message
      alert('Assignment created successfully!')

    } catch (error) {
      console.error('Error creating assignment:', error)
      // toast error would go here
      alert('Failed to create assignment: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const getSubmissionsForAssignment = (assignmentId: string) => {
    return submissions.filter(sub => sub.assignmentId === assignmentId)
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
            <h1 className="text-3xl font-bold text-gray-900">Assignments & Notes</h1>
            <p className="text-gray-600 mt-1">Create, assign, and manage assignments, notes, and resources for your students</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment/Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Assignment/Note</DialogTitle>
                  <DialogDescription>
                    Create a new assignment, note, resource, or test for your students.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={newAssignment.type} onValueChange={(value: any) => setNewAssignment(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="resource">Resource</SelectItem>
                          <SelectItem value="homework">Homework</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="test">Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <Select value={newAssignment.class} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, class: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {loadingData ? (
                            <SelectItem value="loading" disabled>Loading classes...</SelectItem>
                          ) : classes.length > 0 ? (
                            classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}{cls.section && ` ${cls.section}`}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No classes available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={newAssignment.subject} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, subject: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          {loadingData ? (
                            <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                          ) : subjects.length > 0 ? (
                            subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No subjects assigned</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Due Date - Only show for assignments that need deadlines */}
                  {(['assignment', 'homework', 'project', 'quiz', 'test'].includes(newAssignment.type)) && (
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Max Score - Only show for gradeable items */}
                  {(['assignment', 'homework', 'project', 'quiz', 'test'].includes(newAssignment.type)) && (
                    <div className="space-y-2">
                      <Label htmlFor="maxScore">Max Score</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        value={newAssignment.maxScore}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 100 }))}
                        placeholder="100"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={
                        newAssignment.type === 'note' ? 'Brief description of the note' :
                        newAssignment.type === 'resource' ? 'Description of the resource' :
                        'Brief description of the assignment'
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">
                      {newAssignment.type === 'note' ? 'Note Content' :
                       newAssignment.type === 'resource' ? 'Resource Details' :
                       'Instructions'}
                    </Label>
                    <Textarea
                      id="instructions"
                      value={newAssignment.instructions}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder={
                        newAssignment.type === 'note' ? 'Write your note content here...' :
                        newAssignment.type === 'resource' ? 'Provide details about this resource...' :
                        'Detailed instructions for students'
                      }
                      rows={4}
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <FileUpload
                      onUpload={(files) => setUploadedFiles(prev => [...prev, ...files])}
                      onRemove={(file) => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                      uploadEndpoint="/api/upload/temp-file"
                      existingFiles={uploadedFiles}
                      maxFiles={10}
                      maxSize={25}
                      label="Upload Assignment Files"
                      description="Drag and drop files here or click to browse"
                      additionalData={{
                        uploadType: 'assignment'
                      }}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleCreateAssignment('draft')}
                  >
                    Save as Draft
                  </Button>
                  <Button onClick={() => handleCreateAssignment('published')}>
                    Create & Publish
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assignments">Assignments & Notes</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignments Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {typeof assignment.subject === 'string' ? assignment.subject : assignment.subject?.name || 'General'} • {typeof assignment.class === 'string' ? assignment.class : assignment.class ? `${assignment.class.name}${assignment.class.section ? ` ${assignment.class.section}` : ''}` : 'All Classes'}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {getStatusBadge(assignment.status)}
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(assignment.type)}
                          {getTypeBadge(assignment.type)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Assignment Details */}
                    <div className="space-y-2 text-sm">
                      {assignment.dueDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium">{assignment.dueDate}</span>
                      </div>
                      )}
                      {['assignment', 'homework', 'project', 'quiz', 'test'].includes(assignment.type) && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Max Score:</span>
                        <span className="font-medium">{assignment.maxScore} pts</span>
                      </div>
                      )}
                      {assignment.averageScore && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Average:</span>
                          <span className="font-medium">{assignment.averageScore.toFixed(1)} pts</span>
                        </div>
                      )}
                      {assignment.attachments.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Attachments:</span>
                          <span className="font-medium">{assignment.attachments.length} file(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Submission Stats - Only for gradeable assignments */}
                    {assignment.status === 'published' && ['assignment', 'homework', 'project', 'quiz', 'test'].includes(assignment.type) && (
                      <div className="grid grid-cols-2 gap-2 text-center text-sm">
                        <div className="p-2 bg-blue-50 rounded">
                          <div className="font-bold text-blue-600">{assignment.submissions.submitted}</div>
                          <div className="text-blue-700">Submitted</div>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <div className="font-bold text-green-600">{assignment.submissions.graded}</div>
                          <div className="text-green-700">Graded</div>
                        </div>
                      </div>
                    )}

                    {/* Views for notes and resources */}
                    {assignment.status === 'published' && ['note', 'resource'].includes(assignment.type) && (
                      <div className="text-center text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="font-bold text-gray-600">
                            {assignment.type === 'note' ? 'Shared with class' : 'Available to download'}
                          </div>
                          <div className="text-gray-700">
                            {assignment.type === 'note' ? 'Note' : 'Resource'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar - Only for gradeable assignments */}
                    {assignment.status === 'published' && ['assignment', 'homework', 'project', 'quiz', 'test'].includes(assignment.type) && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round((assignment.submissions.submitted / assignment.submissions.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(assignment.submissions.submitted / assignment.submissions.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setIsViewModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments or notes found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating your first assignment or note.'}
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment/Note
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={submission.studentAvatar} alt={submission.studentName} />
                          <AvatarFallback>
                            {submission.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{submission.studentName}</p>
                          <p className="text-sm text-gray-600">
                            Assignment: {assignments.find(a => a.id === submission.assignmentId)?.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {submission.score && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{submission.score}</div>
                            <div className="text-xs text-gray-600">Score</div>
                          </div>
                        )}
                        {getSubmissionStatusBadge(submission.status)}
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {submission.status !== 'graded' && (
                            <Button size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Grade
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {submission.feedback && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Feedback:</strong> {submission.feedback}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {submissions.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Student submissions will appear here once assignments are published.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherDashboardLayout>
  )
}
