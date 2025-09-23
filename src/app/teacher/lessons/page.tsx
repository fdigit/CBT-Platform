'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TeacherDashboardLayout } from '../../../components/teacher/TeacherDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Download,
  Upload,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Video,
  Image,
  FileIcon,
  Trash2,
  Share,
  Copy,
  Send,
} from 'lucide-react';

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  class: string;
  topic: string;
  duration: number; // in minutes
  objectives: string[];
  materials: string[];
  activities: string[];
  assessment: string;
  homework?: string;
  notes?: string;
  resources: {
    id: string;
    name: string;
    type: 'pdf' | 'video' | 'image' | 'document';
    url: string;
    size: string;
  }[];
  status: 'draft' | 'published' | 'archived';
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
}

export default function TeacherLessons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [uploadedResources, setUploadedResources] = useState<UploadedFile[]>(
    []
  );
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // New lesson form state
  const [newLesson, setNewLesson] = useState({
    title: '',
    subject: 'general',
    class: 'all',
    topic: '',
    duration: 60,
    objectives: [''],
    materials: [''],
    activities: [''],
    assessment: '',
    homework: '',
    notes: '',
    scheduledDate: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }

    fetchLessonPlans();
    fetchTeacherData();
  }, [session, status, router]);

  const fetchTeacherData = async () => {
    try {
      setLoadingData(true);
      const [subjectsResponse, classesResponse] = await Promise.all([
        fetch('/api/teacher/subjects'),
        fetch('/api/teacher/school-classes'), // Fetch all school classes via teacher endpoint
      ]);

      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
      }

      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchLessonPlans = async () => {
    // Mock data - replace with actual API call
    setLessonPlans([
      {
        id: '1',
        title: 'Introduction to Quadratic Equations',
        subject: 'Mathematics',
        class: 'SS 2A',
        topic: 'Algebra',
        duration: 80,
        objectives: [
          'Define quadratic equations',
          'Identify coefficients in quadratic equations',
          'Solve simple quadratic equations',
        ],
        materials: [
          'Whiteboard',
          'Calculator',
          'Textbook Chapter 5',
          'Practice worksheets',
        ],
        activities: [
          'Warm-up review of linear equations (10 mins)',
          'Introduction to quadratic form (20 mins)',
          'Guided practice examples (30 mins)',
          'Independent practice (15 mins)',
          'Wrap-up and homework assignment (5 mins)',
        ],
        assessment: 'Exit ticket with 3 quadratic equation problems',
        homework: 'Complete exercises 5.1-5.10 in textbook',
        resources: [
          {
            id: '1',
            name: 'Quadratic Equations Slides.pdf',
            type: 'pdf',
            url: '/resources/quadratic-slides.pdf',
            size: '2.3 MB',
          },
          {
            id: '2',
            name: 'Practice Worksheet.pdf',
            type: 'pdf',
            url: '/resources/practice-worksheet.pdf',
            size: '1.1 MB',
          },
        ],
        status: 'published',
        reviewStatus: 'approved',
        reviewedBy: 'Dr. Smith',
        reviewedAt: '2024-01-16T09:00:00Z',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-16',
        scheduledDate: '2024-01-20',
      },
      {
        id: '2',
        title: 'Newton&apos;s Laws of Motion',
        subject: 'Physics',
        class: 'SS 1B',
        topic: 'Mechanics',
        duration: 60,
        objectives: [
          'State Newton&apos;s three laws of motion',
          'Apply Newton&apos;s laws to real-world scenarios',
          'Calculate force, mass, and acceleration',
        ],
        materials: [
          'Physics lab equipment',
          'Demonstration cart',
          'Weights and springs',
          'Stopwatch',
        ],
        activities: [
          'Review previous lesson (5 mins)',
          'Demonstration of inertia (15 mins)',
          'Interactive experiments (25 mins)',
          'Problem-solving session (10 mins)',
          'Summary and questions (5 mins)',
        ],
        assessment: 'Lab report on motion experiments',
        homework: 'Read Chapter 3 and answer review questions',
        resources: [
          {
            id: '3',
            name: 'Newton Laws Demo Video.mp4',
            type: 'video',
            url: '/resources/newton-demo.mp4',
            size: '45.2 MB',
          },
        ],
        status: 'draft',
        reviewStatus: 'pending',
        createdAt: '2024-01-14',
        updatedAt: '2024-01-17',
        scheduledDate: '2024-01-22',
      },
      {
        id: '3',
        title: 'Calculus: Introduction to Derivatives',
        subject: 'Mathematics',
        class: 'SS 2A',
        topic: 'Calculus',
        duration: 90,
        objectives: [
          'Understand the concept of derivatives',
          'Calculate basic derivatives using rules',
          'Apply derivatives to rate of change problems',
        ],
        materials: [
          'Graphing calculator',
          'Graph paper',
          'Calculus textbook',
          'Online graphing tools',
        ],
        activities: [
          'Review of limits (15 mins)',
          'Introduction to derivative concept (25 mins)',
          'Basic derivative rules (30 mins)',
          'Practice problems (15 mins)',
          'Q&A session (5 mins)',
        ],
        assessment: 'Quiz on basic derivative calculations',
        resources: [],
        status: 'archived',
        reviewStatus: 'approved',
        reviewedBy: 'Dr. Johnson',
        reviewedAt: '2024-01-11T14:30:00Z',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-12',
      },
    ]);
  };

  const filteredLessons = lessonPlans.filter(lesson => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || lesson.status === filterStatus;
    const matchesSubject =
      filterSubject === 'all' || lesson.subject === filterSubject;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge variant="default" className="bg-green-600">
            Published
          </Badge>
        );
      case 'draft':
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            Draft
          </Badge>
        );
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getReviewStatusBadge = (reviewStatus: string) => {
    switch (reviewStatus) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-600">
            Approved
          </Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'needs_revision':
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            Needs Revision
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Pending Review
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileIcon className="h-4 w-4 text-red-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-blue-600" />;
      case 'image':
        return <Image className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleCreateLesson = async (
    status: 'draft' | 'published' = 'published'
  ) => {
    try {
      // First create the lesson plan
      const response = await fetch('/api/teacher/lesson-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newLesson.title,
          topic: newLesson.topic,
          duration: newLesson.duration,
          objectives: newLesson.objectives.filter(obj => obj.trim()),
          materials: newLesson.materials.filter(mat => mat.trim()),
          activities: newLesson.activities.filter(act => act.trim()),
          assessment: newLesson.assessment,
          homework: newLesson.homework,
          notes: newLesson.notes,
          scheduledDate: newLesson.scheduledDate || null,
          status: status.toUpperCase(),
          classId: newLesson.class === 'all' ? null : newLesson.class,
          subjectId: newLesson.subject === 'general' ? null : newLesson.subject,
          resources: uploadedResources.map(file => ({
            fileName: file.id,
            originalName: file.name,
            filePath: file.url,
            fileSize: file.size,
            mimeType: file.type,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create lesson plan');
      }

      const { lessonPlan } = await response.json();

      // Add to local state for immediate UI update
      const createdLessonPlan: LessonPlan = {
        id: lessonPlan.id,
        title: lessonPlan.title,
        subject: lessonPlan.subject?.name || 'General',
        class: lessonPlan.class
          ? `${lessonPlan.class.name}${lessonPlan.class.section ? ` ${lessonPlan.class.section}` : ''}`
          : 'All Classes',
        topic: lessonPlan.topic || '',
        duration: lessonPlan.duration,
        objectives: lessonPlan.objectives || [],
        materials: lessonPlan.materials || [],
        activities: lessonPlan.activities || [],
        assessment: lessonPlan.assessment || '',
        homework: lessonPlan.homework || '',
        notes: lessonPlan.notes || '',
        resources: uploadedResources.map(file => ({
          id: file.id || '',
          name: file.name,
          type: file.type.includes('pdf')
            ? 'pdf'
            : file.type.includes('video')
              ? 'video'
              : file.type.includes('image')
                ? 'image'
                : 'document',
          url: file.url,
          size: `${Math.round(file.size / 1024)} KB`,
        })),
        status: lessonPlan.status.toLowerCase() as any,
        reviewStatus: lessonPlan.reviewStatus.toLowerCase() as any,
        createdAt: new Date(lessonPlan.createdAt).toISOString().split('T')[0],
        updatedAt: new Date(lessonPlan.updatedAt).toISOString().split('T')[0],
        scheduledDate: lessonPlan.scheduledDate
          ? new Date(lessonPlan.scheduledDate).toISOString().split('T')[0]
          : undefined,
      };

      setLessonPlans([createdLessonPlan, ...lessonPlans]);
      setIsCreateModalOpen(false);

      // Reset form
      setNewLesson({
        title: '',
        subject: 'general',
        class: 'all',
        topic: '',
        duration: 60,
        objectives: [''],
        materials: [''],
        activities: [''],
        assessment: '',
        homework: '',
        notes: '',
        scheduledDate: '',
      });
      setUploadedResources([]);

      // Show success message
      // toast success would go here
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      alert(
        'Failed to create lesson plan: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const addArrayField = (field: 'objectives' | 'materials' | 'activities') => {
    setNewLesson(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const updateArrayField = (
    field: 'objectives' | 'materials' | 'activities',
    index: number,
    value: string
  ) => {
    setNewLesson(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeArrayField = (
    field: 'objectives' | 'materials' | 'activities',
    index: number
  ) => {
    setNewLesson(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'TEACHER') {
    return null;
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Lesson Plans & Notes
            </h1>
            <p className="text-gray-600 mt-1">
              Create, manage, and share your lesson plans and teaching resources
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lesson Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Lesson Plan</DialogTitle>
                  <DialogDescription>
                    Design a comprehensive lesson plan with objectives,
                    activities, and resources.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Lesson Title</Label>
                      <Input
                        id="title"
                        value={newLesson.title}
                        onChange={e =>
                          setNewLesson(prev => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Enter lesson title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        value={newLesson.topic}
                        onChange={e =>
                          setNewLesson(prev => ({
                            ...prev,
                            topic: e.target.value,
                          }))
                        }
                        placeholder="Enter lesson topic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <Select
                        value={newLesson.class}
                        onValueChange={value =>
                          setNewLesson(prev => ({ ...prev, class: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {loadingData ? (
                            <SelectItem value="loading" disabled>
                              Loading classes...
                            </SelectItem>
                          ) : classes.length > 0 ? (
                            classes.map(cls => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                                {cls.section && ` ${cls.section}`}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No classes available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select
                        value={newLesson.subject}
                        onValueChange={value =>
                          setNewLesson(prev => ({ ...prev, subject: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          {loadingData ? (
                            <SelectItem value="loading" disabled>
                              Loading subjects...
                            </SelectItem>
                          ) : subjects.length > 0 ? (
                            subjects.map(subject => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No subjects assigned
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newLesson.duration}
                        onChange={e =>
                          setNewLesson(prev => ({
                            ...prev,
                            duration: parseInt(e.target.value),
                          }))
                        }
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">
                      Scheduled Date (Optional)
                    </Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={newLesson.scheduledDate}
                      onChange={e =>
                        setNewLesson(prev => ({
                          ...prev,
                          scheduledDate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Learning Objectives */}
                  <div className="space-y-2">
                    <Label>Learning Objectives</Label>
                    {newLesson.objectives.map((objective, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={objective}
                          onChange={e =>
                            updateArrayField(
                              'objectives',
                              index,
                              e.target.value
                            )
                          }
                          placeholder={`Objective ${index + 1}`}
                        />
                        {newLesson.objectives.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              removeArrayField('objectives', index)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayField('objectives')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Objective
                    </Button>
                  </div>

                  {/* Materials */}
                  <div className="space-y-2">
                    <Label>Materials Needed</Label>
                    {newLesson.materials.map((material, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={material}
                          onChange={e =>
                            updateArrayField('materials', index, e.target.value)
                          }
                          placeholder={`Material ${index + 1}`}
                        />
                        {newLesson.materials.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeArrayField('materials', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayField('materials')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Material
                    </Button>
                  </div>

                  {/* Activities */}
                  <div className="space-y-2">
                    <Label>Lesson Activities</Label>
                    {newLesson.activities.map((activity, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={activity}
                          onChange={e =>
                            updateArrayField(
                              'activities',
                              index,
                              e.target.value
                            )
                          }
                          placeholder={`Activity ${index + 1}`}
                        />
                        {newLesson.activities.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              removeArrayField('activities', index)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayField('activities')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Activity
                    </Button>
                  </div>

                  {/* Assessment */}
                  <div className="space-y-2">
                    <Label htmlFor="assessment">Assessment Method</Label>
                    <Textarea
                      id="assessment"
                      value={newLesson.assessment}
                      onChange={e =>
                        setNewLesson(prev => ({
                          ...prev,
                          assessment: e.target.value,
                        }))
                      }
                      placeholder="Describe how you will assess student learning"
                      rows={3}
                    />
                  </div>

                  {/* Homework */}
                  <div className="space-y-2">
                    <Label htmlFor="homework">
                      Homework Assignment (Optional)
                    </Label>
                    <Textarea
                      id="homework"
                      value={newLesson.homework}
                      onChange={e =>
                        setNewLesson(prev => ({
                          ...prev,
                          homework: e.target.value,
                        }))
                      }
                      placeholder="Describe homework assignment"
                      rows={2}
                    />
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={newLesson.notes}
                      onChange={e =>
                        setNewLesson(prev => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Any additional notes or reminders"
                      rows={2}
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <Label>Resources & Materials</Label>
                    <FileUpload
                      onUpload={files =>
                        setUploadedResources(prev => [...prev, ...files])
                      }
                      onRemove={file =>
                        setUploadedResources(prev =>
                          prev.filter(f => f.id !== file.id)
                        )
                      }
                      uploadEndpoint="/api/upload/temp-file"
                      existingFiles={uploadedResources}
                      maxFiles={15}
                      maxSize={25}
                      acceptedTypes={[
                        'pdf',
                        'doc',
                        'docx',
                        'ppt',
                        'pptx',
                        'xls',
                        'xlsx',
                        'txt',
                        'jpg',
                        'jpeg',
                        'png',
                        'gif',
                        'mp4',
                        'mp3',
                      ]}
                      label="Upload Lesson Resources"
                      description="Upload teaching materials, slides, videos, etc."
                      additionalData={{
                        uploadType: 'lesson-plan',
                      }}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCreateLesson('draft')}
                  >
                    Save as Draft
                  </Button>
                  <Button onClick={() => handleCreateLesson('published')}>
                    Create & Submit for Review
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search lesson plans..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-40">
              <BookOpen className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.name}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lesson Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map(lesson => (
            <Card
              key={lesson.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {lesson.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {lesson.subject} • {lesson.class}
                    </p>
                    <p className="text-sm text-gray-500">
                      Topic: {lesson.topic}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusBadge(lesson.status)}
                      {lesson.status !== 'draft' &&
                        getReviewStatusBadge(lesson.reviewStatus)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Lesson Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{lesson.duration} mins</span>
                  </div>
                  {lesson.scheduledDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{lesson.scheduledDate}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{lesson.objectives.length} objectives</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>{lesson.resources.length} resources</span>
                  </div>
                </div>

                {/* Resources Preview */}
                {lesson.resources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Resources
                    </h4>
                    <div className="space-y-1">
                      {lesson.resources.slice(0, 2).map(resource => (
                        <div
                          key={resource.id}
                          className="flex items-center space-x-2 text-sm"
                        >
                          {getResourceIcon(resource.type)}
                          <span className="truncate">{resource.name}</span>
                          <span className="text-gray-400">
                            ({resource.size})
                          </span>
                        </div>
                      ))}
                      {lesson.resources.length > 2 && (
                        <p className="text-sm text-gray-500">
                          +{lesson.resources.length - 2} more resources
                        </p>
                      )}
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
                        setSelectedLesson(lesson);
                        setIsViewModalOpen(true);
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
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Lesson Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedLesson && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedLesson.title}</DialogTitle>
                  <DialogDescription>
                    {selectedLesson.subject} • {selectedLesson.class} •{' '}
                    {selectedLesson.topic}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-sm text-gray-600">
                        {selectedLesson.duration} minutes
                      </p>
                    </div>
                    {selectedLesson.scheduledDate && (
                      <div>
                        <Label className="text-sm font-medium">
                          Scheduled Date
                        </Label>
                        <p className="text-sm text-gray-600">
                          {selectedLesson.scheduledDate}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Objectives */}
                  <div>
                    <Label className="text-sm font-medium">
                      Learning Objectives
                    </Label>
                    <ul className="mt-2 space-y-1">
                      {selectedLesson.objectives.map((objective, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-start"
                        >
                          <span className="mr-2">•</span>
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Materials */}
                  <div>
                    <Label className="text-sm font-medium">
                      Materials Needed
                    </Label>
                    <ul className="mt-2 space-y-1">
                      {selectedLesson.materials.map((material, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-start"
                        >
                          <span className="mr-2">•</span>
                          {material}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Activities */}
                  <div>
                    <Label className="text-sm font-medium">
                      Lesson Activities
                    </Label>
                    <ol className="mt-2 space-y-1">
                      {selectedLesson.activities.map((activity, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-start"
                        >
                          <span className="mr-2">{index + 1}.</span>
                          {activity}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Assessment */}
                  <div>
                    <Label className="text-sm font-medium">Assessment</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedLesson.assessment}
                    </p>
                  </div>

                  {/* Homework */}
                  {selectedLesson.homework && (
                    <div>
                      <Label className="text-sm font-medium">Homework</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedLesson.homework}
                      </p>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {selectedLesson.notes && (
                    <div>
                      <Label className="text-sm font-medium">
                        Additional Notes
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedLesson.notes}
                      </p>
                    </div>
                  )}

                  {/* Review Status */}
                  {selectedLesson.status !== 'draft' && (
                    <div>
                      <Label className="text-sm font-medium">
                        Review Status
                      </Label>
                      <div className="mt-1 space-y-2">
                        <div>
                          {getReviewStatusBadge(selectedLesson.reviewStatus)}
                        </div>
                        {selectedLesson.reviewedBy && (
                          <p className="text-sm text-gray-600">
                            Reviewed by {selectedLesson.reviewedBy}
                            {selectedLesson.reviewedAt && (
                              <span>
                                {' '}
                                on{' '}
                                {new Date(
                                  selectedLesson.reviewedAt
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        )}
                        {selectedLesson.reviewNotes && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Review Notes:</strong>{' '}
                              {selectedLesson.reviewNotes}
                            </p>
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
                        {selectedLesson.resources.map(resource => (
                          <div
                            key={resource.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center space-x-2">
                              {getResourceIcon(resource.type)}
                              <span className="text-sm font-medium">
                                {resource.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({resource.size})
                              </span>
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
                  <Button
                    variant="outline"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </Button>
                  {selectedLesson.reviewStatus !== 'approved' && (
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Lesson
                    </Button>
                  )}
                  {selectedLesson.status === 'draft' && (
                    <Button variant="default">
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Review
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {filteredLessons.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No lesson plans found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'Get started by creating your first lesson plan.'}
            </p>
            {!searchQuery && (
              <Button
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Lesson Plan
              </Button>
            )}
          </div>
        )}
      </div>
    </TeacherDashboardLayout>
  );
}
