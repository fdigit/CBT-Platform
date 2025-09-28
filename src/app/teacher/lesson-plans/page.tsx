'use client';

import {
  BookOpen,
  Clock,
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TeacherDashboardLayout } from '../../../components/teacher';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
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
  resources: Array<{
    id: string;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    resourceType: string;
    uploadedAt: string;
  }>;
}

interface Filters {
  search: string;
  status: string;
  reviewStatus: string;
  classId: string;
  subjectId: string;
}

export default function TeacherLessonPlans() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    reviewStatus: 'all',
    classId: 'all',
    subjectId: 'all',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }

    fetchLessonPlans();
  }, [session, status, router, currentPage, filters]);

  const fetchLessonPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v && v !== 'all')
        ),
      });

      const response = await fetch(`/api/teacher/lesson-plans?${params}`);
      if (!response.ok) throw new Error('Failed to fetch lesson plans');

      const data = await response.json();
      setLessonPlans(data.lessonPlans);
      setTotalPages(data.pagination.totalPages);
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

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            Draft
          </Badge>
        );
      case 'PUBLISHED':
        return (
          <Badge variant="default" className="bg-green-600">
            Published
          </Badge>
        );
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getReviewStatusBadge = (reviewStatus: string) => {
    switch (reviewStatus) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Pending
          </Badge>
        );
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
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSubmitForReview = async (lessonPlanId: string) => {
    try {
      const response = await fetch(
        `/api/teacher/lesson-plans/${lessonPlanId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PUBLISHED' }),
        }
      );

      if (!response.ok) throw new Error('Failed to submit lesson plan');

      toast({
        title: 'Success',
        description: 'Lesson plan submitted for review',
      });

      fetchLessonPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit lesson plan',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (lessonPlanId: string) => {
    if (!confirm('Are you sure you want to delete this lesson plan?')) return;

    try {
      const response = await fetch(
        `/api/teacher/lesson-plans/${lessonPlanId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete lesson plan');

      toast({
        title: 'Success',
        description: 'Lesson plan deleted successfully',
      });

      fetchLessonPlans();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lesson plan',
        variant: 'destructive',
      });
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

  if (!session || session.user.role !== 'TEACHER') {
    return null;
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lesson Plans</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your lesson plans
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => router.push('/teacher/lesson-plans/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Lesson Plan
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search lesson plans..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={value => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.reviewStatus}
            onValueChange={value => handleFilterChange('reviewStatus', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Reviews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lesson Plans Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Review Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessonPlans.map(lessonPlan => (
                  <TableRow key={lessonPlan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lessonPlan.title}</p>
                        {lessonPlan.topic && (
                          <p className="text-sm text-gray-500">
                            {lessonPlan.topic}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lessonPlan.subject ? (
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span>{lessonPlan.subject.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lessonPlan.class ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>
                            {lessonPlan.class.name}
                            {lessonPlan.class.section &&
                              ` ${lessonPlan.class.section}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{lessonPlan.duration} min</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lessonPlan.status)}</TableCell>
                    <TableCell>
                      {getReviewStatusBadge(lessonPlan.reviewStatus)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(lessonPlan.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/teacher/lesson-plans/${lessonPlan.id}`
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {lessonPlan.reviewStatus !== 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/teacher/lesson-plans/${lessonPlan.id}/edit`
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {lessonPlan.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            onClick={() => handleSubmitForReview(lessonPlan.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        {lessonPlan.reviewStatus !== 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(lessonPlan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {lessonPlans.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No lesson plans found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.search
                    ? 'Try adjusting your search criteria.'
                    : 'Create your first lesson plan to get started.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </TeacherDashboardLayout>
  );
}
