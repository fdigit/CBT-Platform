'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  BookOpen,
  AlertTriangle,
  MessageSquare,
  Download,
  BarChart3,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SchoolDashboardLayout } from '@/components/school'

interface LessonPlan {
  id: string
  title: string
  subject: string
  class: string
  topic: string
  duration: number
  objectives: string[]
  materials: string[]
  activities: string[]
  assessment: string
  homework?: string
  notes?: string
  teacherName: string
  teacherId: string
  status: 'draft' | 'published' | 'archived'
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  scheduledDate?: string
  resources: {
    id: string
    name: string
    type: 'pdf' | 'video' | 'image' | 'document'
    url: string
    size: string
  }[]
}

interface ReviewForm {
  status: 'approved' | 'rejected' | 'needs_revision'
  notes: string
}

export default function SchoolLessonPlans() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterTeacher, setFilterTeacher] = useState('all')
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    status: 'approved',
    notes: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchLessonPlans()
  }, [session, status, router])

  const fetchLessonPlans = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      setLessonPlans([
        {
          id: '1',
          title: 'Introduction to Quadratic Equations',
          subject: 'Mathematics',
          class: 'SS 2A',
          topic: 'Algebra',
          duration: 80,
          teacherName: 'Mr. Johnson',
          teacherId: 'teacher1',
          objectives: [
            'Define quadratic equations',
            'Identify coefficients in quadratic equations',
            'Solve simple quadratic equations'
          ],
          materials: [
            'Whiteboard',
            'Calculator',
            'Textbook Chapter 5',
            'Practice worksheets'
          ],
          activities: [
            'Warm-up review of linear equations (10 mins)',
            'Introduction to quadratic form (20 mins)',
            'Guided practice examples (30 mins)',
            'Independent practice (15 mins)',
            'Wrap-up and homework assignment (5 mins)'
          ],
          assessment: 'Exit ticket with 3 quadratic equation problems',
          homework: 'Complete exercises 5.1-5.10 in textbook',
          resources: [
            {
              id: '1',
              name: 'Quadratic Equations Slides.pdf',
              type: 'pdf',
              url: '/resources/quadratic-slides.pdf',
              size: '2.3 MB'
            }
          ],
          status: 'published',
          reviewStatus: 'pending',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-16',
          scheduledDate: '2024-01-20'
        },
        {
          id: '2',
          title: 'Newton\'s Laws of Motion',
          subject: 'Physics',
          class: 'SS 1B',
          topic: 'Mechanics',
          duration: 60,
          teacherName: 'Mrs. Davis',
          teacherId: 'teacher2',
          objectives: [
            'State Newton\'s three laws of motion',
            'Apply Newton\'s laws to real-world scenarios',
            'Calculate force, mass, and acceleration'
          ],
          materials: [
            'Physics lab equipment',
            'Demonstration cart',
            'Weights and springs',
            'Stopwatch'
          ],
          activities: [
            'Review previous lesson (5 mins)',
            'Demonstration of inertia (15 mins)',
            'Interactive experiments (25 mins)',
            'Problem-solving session (10 mins)',
            'Summary and questions (5 mins)'
          ],
          assessment: 'Lab report on motion experiments',
          homework: 'Read Chapter 3 and answer review questions',
          resources: [
            {
              id: '2',
              name: 'Newton Laws Demo Video.mp4',
              type: 'video',
              url: '/resources/newton-demo.mp4',
              size: '45.2 MB'
            }
          ],
          status: 'published',
          reviewStatus: 'approved',
          reviewedBy: 'Dr. Smith',
          reviewedAt: '2024-01-18T10:00:00Z',
          createdAt: '2024-01-14',
          updatedAt: '2024-01-17',
          scheduledDate: '2024-01-22'
        },
        {
          id: '3',
          title: 'Cell Division and Mitosis',
          subject: 'Biology',
          class: 'SS 2B',
          topic: 'Cell Biology',
          duration: 70,
          teacherName: 'Dr. Williams',
          teacherId: 'teacher3',
          objectives: [
            'Explain the process of cell division',
            'Identify stages of mitosis',
            'Compare mitosis and meiosis'
          ],
          materials: [
            'Microscopes',
            'Prepared slides',
            'Cell division models',
            'Worksheets'
          ],
          activities: [
            'Review cell structure (10 mins)',
            'Microscope observation (25 mins)',
            'Model demonstration (20 mins)',
            'Group discussion (10 mins)',
            'Summary and assessment (5 mins)'
          ],
          assessment: 'Diagram labeling and short answer questions',
          homework: 'Complete cell division worksheet',
          notes: 'Ensure all microscopes are working before class',
          resources: [],
          status: 'published',
          reviewStatus: 'needs_revision',
          reviewNotes: 'Please add more specific learning outcomes and include safety procedures for microscope use.',
          reviewedBy: 'Dr. Smith',
          reviewedAt: '2024-01-19T14:30:00Z',
          createdAt: '2024-01-16',
          updatedAt: '2024-01-17',
          scheduledDate: '2024-01-25'
        },
        {
          id: '4',
          title: 'Shakespeare\'s Romeo and Juliet',
          subject: 'English',
          class: 'SS 1A',
          topic: 'Literature',
          duration: 90,
          teacherName: 'Ms. Thompson',
          teacherId: 'teacher4',
          objectives: [
            'Analyze character development in Romeo and Juliet',
            'Identify themes of love and conflict',
            'Understand Shakespearean language and context'
          ],
          materials: [
            'Romeo and Juliet text',
            'Audio recording',
            'Character analysis worksheets',
            'Projector for video clips'
          ],
          activities: [
            'Reading Act 2, Scene 2 (25 mins)',
            'Character analysis discussion (30 mins)',
            'Video clip analysis (20 mins)',
            'Creative writing exercise (10 mins)',
            'Wrap-up and preview (5 mins)'
          ],
          assessment: 'Character analysis essay assignment',
          homework: 'Read Act 3 and complete character map',
          resources: [
            {
              id: '3',
              name: 'Romeo and Juliet Study Guide.pdf',
              type: 'pdf',
              url: '/resources/romeo-juliet-guide.pdf',
              size: '1.8 MB'
            }
          ],
          status: 'published',
          reviewStatus: 'rejected',
          reviewNotes: 'The lesson plan lacks clear assessment criteria and does not align with curriculum standards. Please revise to include specific learning objectives and rubrics.',
          reviewedBy: 'Prof. Anderson',
          reviewedAt: '2024-01-20T09:15:00Z',
          createdAt: '2024-01-18',
          updatedAt: '2024-01-19',
          scheduledDate: '2024-01-28'
        }
      ])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch lesson plans',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getReviewStatusBadge = (reviewStatus: string) => {
    switch (reviewStatus) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'needs_revision':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Needs Revision</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Pending Review</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-600">Published</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Draft</Badge>
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredLessonPlans = lessonPlans.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lesson.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lesson.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || lesson.reviewStatus === filterStatus
    const matchesSubject = filterSubject === 'all' || lesson.subject === filterSubject
    const matchesTeacher = filterTeacher === 'all' || lesson.teacherId === filterTeacher
    
    // Tab filtering
    let matchesTab = true
    if (activeTab === 'pending') {
      matchesTab = lesson.reviewStatus === 'pending'
    } else if (activeTab === 'approved') {
      matchesTab = lesson.reviewStatus === 'approved'
    } else if (activeTab === 'needs_action') {
      matchesTab = lesson.reviewStatus === 'rejected' || lesson.reviewStatus === 'needs_revision'
    }
    
    return matchesSearch && matchesStatus && matchesSubject && matchesTeacher && matchesTab
  })

  const handleReview = async (lessonId: string) => {
    try {
      // Mock review - replace with actual API call
      toast({
        title: 'Success',
        description: 'Lesson plan reviewed successfully',
      })
      setIsReviewModalOpen(false)
      setReviewForm({ status: 'approved', notes: '' })
      // Refresh lesson plans
      fetchLessonPlans()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to review lesson plan',
        variant: 'destructive',
      })
    }
  }

  const getTabCount = (tabName: string) => {
    switch (tabName) {
      case 'pending':
        return lessonPlans.filter(l => l.reviewStatus === 'pending').length
      case 'approved':
        return lessonPlans.filter(l => l.reviewStatus === 'approved').length
      case 'needs_action':
        return lessonPlans.filter(l => l.reviewStatus === 'rejected' || l.reviewStatus === 'needs_revision').length
      default:
        return lessonPlans.length
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'SCHOOL_ADMIN') {
    return null
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lesson Plan Review</h1>
            <p className="text-gray-600 mt-1">Review and approve teacher lesson plans</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{getTabCount('pending')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{getTabCount('approved')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Needs Action</p>
                  <p className="text-2xl font-bold text-gray-900">{getTabCount('needs_action')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{lessonPlans.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({lessonPlans.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({getTabCount('pending')})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({getTabCount('approved')})</TabsTrigger>
            <TabsTrigger value="needs_action">Needs Action ({getTabCount('needs_action')})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search lesson plans, subjects, or teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  <SelectItem value="teacher1">Mr. Johnson</SelectItem>
                  <SelectItem value="teacher2">Mrs. Davis</SelectItem>
                  <SelectItem value="teacher3">Dr. Williams</SelectItem>
                  <SelectItem value="teacher4">Ms. Thompson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lesson Plans Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lesson Plan</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Review Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLessonPlans.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-sm text-gray-500">{lesson.topic}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{lesson.teacherName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{lesson.subject}</TableCell>
                        <TableCell>{lesson.class}</TableCell>
                        <TableCell>
                          {lesson.scheduledDate ? (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{lesson.scheduledDate}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(lesson.status)}</TableCell>
                        <TableCell>{getReviewStatusBadge(lesson.reviewStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLesson(lesson)
                                setIsViewModalOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {lesson.reviewStatus === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedLesson(lesson)
                                  setIsReviewModalOpen(true)
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredLessonPlans.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No lesson plans found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'No lesson plans match the selected filters.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Lesson Plan Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            {selectedLesson && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedLesson.title}</DialogTitle>
                  <DialogDescription>
                    {selectedLesson.subject} • {selectedLesson.class} • {selectedLesson.teacherName}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Status Badges */}
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(selectedLesson.status)}
                    {getReviewStatusBadge(selectedLesson.reviewStatus)}
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Topic</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedLesson.topic}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedLesson.duration} minutes</p>
                    </div>
                    {selectedLesson.scheduledDate && (
                      <div>
                        <Label className="text-sm font-medium">Scheduled Date</Label>
                        <p className="text-sm text-gray-600 mt-1">{selectedLesson.scheduledDate}</p>
                      </div>
                    )}
                  </div>

                  {/* Learning Objectives */}
                  <div>
                    <Label className="text-sm font-medium">Learning Objectives</Label>
                    <ul className="mt-2 space-y-1">
                      {selectedLesson.objectives.map((objective, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2">•</span>
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Materials */}
                  <div>
                    <Label className="text-sm font-medium">Materials Needed</Label>
                    <ul className="mt-2 space-y-1">
                      {selectedLesson.materials.map((material, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2">•</span>
                          {material}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Activities */}
                  <div>
                    <Label className="text-sm font-medium">Lesson Activities</Label>
                    <ol className="mt-2 space-y-1">
                      {selectedLesson.activities.map((activity, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2">{index + 1}.</span>
                          {activity}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Assessment */}
                  <div>
                    <Label className="text-sm font-medium">Assessment</Label>
                    <p className="text-sm text-gray-600 mt-1">{selectedLesson.assessment}</p>
                  </div>

                  {/* Homework */}
                  {selectedLesson.homework && (
                    <div>
                      <Label className="text-sm font-medium">Homework</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedLesson.homework}</p>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {selectedLesson.notes && (
                    <div>
                      <Label className="text-sm font-medium">Additional Notes</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedLesson.notes}</p>
                    </div>
                  )}

                  {/* Review Information */}
                  {selectedLesson.reviewStatus !== 'pending' && (
                    <div>
                      <Label className="text-sm font-medium">Review Information</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getReviewStatusBadge(selectedLesson.reviewStatus)}
                        </div>
                        {selectedLesson.reviewedBy && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Reviewed by:</span>
                            <span className="text-sm font-medium">{selectedLesson.reviewedBy}</span>
                          </div>
                        )}
                        {selectedLesson.reviewedAt && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Reviewed on:</span>
                            <span className="text-sm font-medium">
                              {new Date(selectedLesson.reviewedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedLesson.reviewNotes && (
                          <div className="mt-3">
                            <span className="text-sm text-gray-600">Review Notes:</span>
                            <p className="text-sm text-gray-800 mt-1">{selectedLesson.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {selectedLesson.resources.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Resources</Label>
                      <div className="mt-2 space-y-2">
                        {selectedLesson.resources.map((resource) => (
                          <div key={resource.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">{resource.name}</span>
                              <span className="text-xs text-gray-500">({resource.size})</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                  {selectedLesson.reviewStatus === 'pending' && (
                    <Button onClick={() => {
                      setIsViewModalOpen(false)
                      setIsReviewModalOpen(true)
                    }}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Review Lesson Plan
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Review Modal */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedLesson && (
              <>
                <DialogHeader>
                  <DialogTitle>Review Lesson Plan</DialogTitle>
                  <DialogDescription>
                    Provide feedback for "{selectedLesson.title}" by {selectedLesson.teacherName}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewStatus">Review Decision</Label>
                    <Select 
                      value={reviewForm.status} 
                      onValueChange={(value: any) => setReviewForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select review decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="needs_revision">Needs Revision</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewNotes">Review Notes</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewForm.notes}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder={
                        reviewForm.status === 'approved' 
                          ? 'Optional: Add any positive feedback or suggestions...'
                          : 'Please provide specific feedback and suggestions for improvement...'
                      }
                      rows={6}
                      required={reviewForm.status !== 'approved'}
                    />
                  </div>

                  {reviewForm.status !== 'approved' && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-800">
                          Please provide constructive feedback to help the teacher improve their lesson plan.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleReview(selectedLesson.id)}
                    disabled={reviewForm.status !== 'approved' && !reviewForm.notes.trim()}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Submit Review
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SchoolDashboardLayout>
  )
}
