'use client';

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  MessageSquare,
  Search,
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SchoolDashboardLayout } from '../../../components/school';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../hooks/use-toast';

interface LessonPlan {
  id: string;
  title: string;
  topic?: string;
  duration: number;
  objectives: string[];
  materials: string[];
  activities: string[];
  assessment?: string;
  homework?: string;
  notes?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  teacher: {
    id: string;
    employeeId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  class?: {
    id: string;
    name: string;
    section?: string;
  };
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
  resources: {
    id: string;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    resourceType: string;
    uploadedAt: string;
  }[];
}

interface ReviewForm {
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  notes: string;
}

export default function SchoolLessonPlans() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    status: 'APPROVED',
    notes: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchLessonPlans();
  }, [session, status, router]);

  const fetchLessonPlans = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...Object.fromEntries(
          Object.entries({
            search: searchQuery,
            status: filterStatus,
            teacherId: filterTeacher,
            classId: 'all',
            subjectId: filterSubject,
          }).filter(([_, v]) => v && v !== 'all')
        ),
      });

      const response = await fetch(`/api/admin/lesson-plans?${params}`);
      if (!response.ok) throw new Error('Failed to fetch lesson plans');

      const data = await response.json();
      console.log('Fetched lesson plans:', data.lessonPlans);
      setLessonPlans(data.lessonPlans || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch lesson plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getReviewStatusBadge = (reviewStatus: string) => {
    switch (reviewStatus) {
      case 'APPROVED':
        return (
          <Badge variant="default" className="bg-green-600">
            Approved
          </Badge>
        );
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'NEEDS_REVISION':
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            Needs Revision
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Pending Review
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge variant="default" className="bg-green-600">
            Published
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            Draft
          </Badge>
        );
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredLessonPlans = lessonPlans.filter(lesson => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.subject?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      lesson.teacher.user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || lesson.reviewStatus === filterStatus;
    const matchesSubject =
      filterSubject === 'all' || lesson.subject?.name === filterSubject;
    const matchesTeacher =
      filterTeacher === 'all' || lesson.teacher.id === filterTeacher;

    // Tab filtering
    let matchesTab = true;
    if (activeTab === 'pending') {
      matchesTab = lesson.reviewStatus === 'PENDING';
    } else if (activeTab === 'approved') {
      matchesTab = lesson.reviewStatus === 'APPROVED';
    } else if (activeTab === 'needs_action') {
      matchesTab =
        lesson.reviewStatus === 'REJECTED' ||
        lesson.reviewStatus === 'NEEDS_REVISION';
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSubject &&
      matchesTeacher &&
      matchesTab
    );
  });

  const handleReview = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/admin/lesson-plans/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });

      if (!response.ok) throw new Error('Failed to review lesson plan');

      toast({
        title: 'Success',
        description: 'Lesson plan reviewed successfully',
      });
      setIsReviewModalOpen(false);
      setReviewForm({ status: 'APPROVED', notes: '' });
      // Refresh lesson plans
      fetchLessonPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to review lesson plan',
        variant: 'destructive',
      });
    }
  };

  const getTabCount = (tabName: string) => {
    switch (tabName) {
      case 'pending':
        return lessonPlans.filter(l => l.reviewStatus === 'PENDING').length;
      case 'approved':
        return lessonPlans.filter(l => l.reviewStatus === 'APPROVED').length;
      case 'needs_action':
        return lessonPlans.filter(
          l =>
            l.reviewStatus === 'REJECTED' || l.reviewStatus === 'NEEDS_REVISION'
        ).length;
      default:
        return lessonPlans.length;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'SCHOOL_ADMIN') {
    return null;
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Lesson Plan Review
            </h1>
            <p className="text-gray-600 mt-1">
              Review and approve teacher lesson plans
            </p>
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
                  <p className="text-sm font-medium text-gray-600">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getTabCount('pending')}
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
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getTabCount('approved')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Needs Action
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getTabCount('needs_action')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Plans
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {lessonPlans.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({lessonPlans.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({getTabCount('pending')})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({getTabCount('approved')})
            </TabsTrigger>
            <TabsTrigger value="needs_action">
              Needs Action ({getTabCount('needs_action')})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search lesson plans, subjects, or teachers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
                    {filteredLessonPlans.map(lesson => (
                      <TableRow key={lesson.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-sm text-gray-500">
                              {lesson.topic}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{lesson.teacher.user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lesson.subject?.name || 'Not assigned'}
                        </TableCell>
                        <TableCell>
                          {lesson.class
                            ? `${lesson.class.name}${lesson.class.section ? ` ${lesson.class.section}` : ''}`
                            : 'Not assigned'}
                        </TableCell>
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
                        <TableCell>
                          {getReviewStatusBadge(lesson.reviewStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('Selected lesson:', lesson);
                                console.log(
                                  'Lesson resources:',
                                  lesson.resources
                                );
                                setSelectedLesson(lesson);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {lesson.reviewStatus === 'PENDING' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedLesson(lesson);
                                  setIsReviewModalOpen(true);
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No lesson plans found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery
                        ? 'Try adjusting your search criteria.'
                        : 'No lesson plans match the selected filters.'}
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
                    {selectedLesson.subject?.name || 'No Subject'} •{' '}
                    {selectedLesson.class?.name || 'No Class'} •{' '}
                    {selectedLesson.teacher?.user?.name || 'Unknown Teacher'}
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
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedLesson.topic}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedLesson.duration} minutes
                      </p>
                    </div>
                    {selectedLesson.scheduledDate && (
                      <div>
                        <Label className="text-sm font-medium">
                          Scheduled Date
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedLesson.scheduledDate}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Learning Objectives */}
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

                  {/* Review Information */}
                  {selectedLesson.reviewStatus !== 'PENDING' && (
                    <div>
                      <Label className="text-sm font-medium">
                        Review Information
                      </Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getReviewStatusBadge(selectedLesson.reviewStatus)}
                        </div>
                        {selectedLesson.reviewer && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Reviewed by:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedLesson.reviewer.name}
                            </span>
                          </div>
                        )}
                        {selectedLesson.reviewedAt && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Reviewed on:
                            </span>
                            <span className="text-sm font-medium">
                              {new Date(
                                selectedLesson.reviewedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedLesson.reviewNotes && (
                          <div className="mt-3">
                            <span className="text-sm text-gray-600">
                              Review Notes:
                            </span>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedLesson.reviewNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {selectedLesson.resources &&
                  selectedLesson.resources.length > 0 ? (
                    <div>
                      <Label className="text-sm font-medium mb-4 block">
                        Lesson Resources ({selectedLesson.resources.length})
                      </Label>
                      <div className="space-y-3">
                        {selectedLesson.resources.map(resource => (
                          <div
                            key={resource.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {resource.mimeType.includes('pdf') ? (
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                      <span className="text-red-600 font-bold text-sm">
                                        PDF
                                      </span>
                                    </div>
                                  ) : resource.mimeType.includes('word') ||
                                    resource.mimeType.includes('document') ? (
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <span className="text-blue-600 font-bold text-sm">
                                        DOC
                                      </span>
                                    </div>
                                  ) : resource.mimeType.includes('image/') ? (
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                      <span className="text-green-600 font-bold text-sm">
                                        IMG
                                      </span>
                                    </div>
                                  ) : resource.mimeType.includes(
                                      'presentation'
                                    ) ? (
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                      <span className="text-orange-600 font-bold text-sm">
                                        PPT
                                      </span>
                                    </div>
                                  ) : resource.mimeType.includes(
                                      'spreadsheet'
                                    ) ? (
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <span className="text-purple-600 font-bold text-sm">
                                        XLS
                                      </span>
                                    </div>
                                  ) : (
                                    <FileText className="h-5 w-5 text-gray-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">
                                    {resource.originalName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {Math.round(resource.fileSize / 1024)} KB •{' '}
                                    {resource.mimeType}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // For PDFs and images, open in new tab
                                    if (
                                      resource.mimeType.includes('pdf') ||
                                      resource.mimeType.startsWith('image/')
                                    ) {
                                      window.open(resource.filePath, '_blank');
                                    } else {
                                      // For other file types, trigger download with proper handling
                                      const downloadUrl = `/api/lesson-plans/${selectedLesson.id}/resources/${resource.id}/download`;
                                      const a = document.createElement('a');
                                      a.href = downloadUrl;
                                      a.download = resource.originalName;
                                      a.click();
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {resource.mimeType.includes('pdf') ||
                                  resource.mimeType.startsWith('image/')
                                    ? 'View'
                                    : 'Open'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Use the proper download endpoint for better file handling
                                    const downloadUrl = `/api/lesson-plans/${selectedLesson.id}/resources/${resource.id}/download`;
                                    const a = document.createElement('a');
                                    a.href = downloadUrl;
                                    a.download = resource.originalName;
                                    a.click();
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-medium mb-4 block">
                        Lesson Resources
                      </Label>
                      <div className="text-center py-4 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">
                          No resources attached to this lesson plan
                        </p>
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
                  {selectedLesson.reviewStatus === 'PENDING' && (
                    <Button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setIsReviewModalOpen(true);
                      }}
                    >
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
                    Provide feedback for &quot;{selectedLesson.title}&quot; by{' '}
                    {selectedLesson.teacher.user.name}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewStatus">Review Decision</Label>
                    <Select
                      value={reviewForm.status}
                      onValueChange={(value: any) =>
                        setReviewForm(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select review decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVED">Approve</SelectItem>
                        <SelectItem value="NEEDS_REVISION">
                          Needs Revision
                        </SelectItem>
                        <SelectItem value="REJECTED">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewNotes">Review Notes</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewForm.notes}
                      onChange={e =>
                        setReviewForm(prev => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder={
                        reviewForm.status === 'APPROVED'
                          ? 'Optional: Add any positive feedback or suggestions...'
                          : 'Please provide specific feedback and suggestions for improvement...'
                      }
                      rows={6}
                      required={reviewForm.status !== 'APPROVED'}
                    />
                  </div>

                  {reviewForm.status !== 'APPROVED' && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-800">
                          Please provide constructive feedback to help the
                          teacher improve their lesson plan.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleReview(selectedLesson.id)}
                    disabled={
                      reviewForm.status !== 'APPROVED' &&
                      !reviewForm.notes.trim()
                    }
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
  );
}
