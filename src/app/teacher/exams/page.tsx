'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertCircle,
    BarChart3,
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    Eye,
    Filter,
    GraduationCap,
    Plus,
    Search,
    Send,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TeacherDashboardLayout } from '../../../components/teacher/TeacherDashboardLayout';
import { useToast } from '../../../hooks/use-toast';

interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  passingMarks?: number;
  status: string;
  dynamicStatus: string;
  createdAt: string;
  updatedAt: string;
  subject?: {
    name: string;
    code: string;
  };
  class?: {
    name: string;
    section?: string;
  };
  approver?: {
    name: string;
  };
  totalQuestions: number;
  studentsAttempted: number;
  studentsCompleted: number;
  questionsByType: Record<string, number>;
  questionsByDifficulty: Record<string, number>;
}

interface Filters {
  status: string;
  subject: string;
  classId: string;
  search: string;
}

export default function TeacherExams() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    subject: 'all',
    classId: 'all',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }

    fetchExams();
  }, [session, status, router, filters, pagination.page]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.subject !== 'all' && { subject: filters.subject }),
        ...(filters.classId !== 'all' && { classId: filters.classId }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/teacher/exams?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Teacher exams data:', data.exams); // Debug log
        setExams(data.exams || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
        }));
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to fetch exams',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching exams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${examTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/exams/${examId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam deleted successfully!',
        });
        fetchExams();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete exam',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting exam',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitForApproval = async (examId: string, examTitle: string) => {
    if (
      !confirm(
        `Submit "${examTitle}" for admin approval? You won't be able to edit it after submission.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/teacher/exams/${examId}/submit-for-approval`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam submitted for approval successfully!',
        });
        fetchExams();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit exam for approval',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while submitting exam',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, dynamicStatus?: string) => {
    const displayStatus = dynamicStatus || status;

    switch (displayStatus) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="text-gray-600">
            <Edit className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'PUBLISHED':
        return (
          <Badge className="bg-blue-600">
            <Calendar className="h-3 w-3 mr-1" />
            Published
          </Badge>
        );
      case 'SCHEDULED':
        return (
          <Badge className="bg-purple-600">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'ACTIVE':
        return (
          <Badge className="bg-green-600">
            <Users className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-gray-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{displayStatus}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const canEdit = (exam: Exam) => {
    return ['DRAFT', 'REJECTED'].includes(exam.status);
  };

  const canDelete = (exam: Exam) => {
    return (
      ['DRAFT', 'REJECTED'].includes(exam.status) &&
      exam.studentsAttempted === 0
    );
  };

  const canSubmitForApproval = (exam: Exam) => {
    return exam.status === 'DRAFT' && exam.totalQuestions > 0;
  };

  if (status === 'loading' || loading) {
    return (
      <TeacherDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exams...</p>
          </div>
        </div>
      </TeacherDashboardLayout>
    );
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Exams</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Create and manage your examinations. Click "Results" to view exam
              results.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push('/teacher/exams/create')}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Create New Exam</span>
            <span className="sm:hidden">Create Exam</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg flex items-center">
              <Filter className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search exams..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={value => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">
                      Pending Approval
                    </SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Subject
                </label>
                <Select
                  value={filters.subject}
                  onValueChange={value => handleFilterChange('subject', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {/* TODO: Load subjects dynamically */}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Class</label>
                <Select
                  value={filters.classId}
                  onValueChange={value => handleFilterChange('classId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {/* TODO: Load classes dynamically */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams List */}
        {exams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 p-4 md:p-6">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Exams Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first exam to get started with testing your
                  students
                </p>
                <Button
                  onClick={() => router.push('/teacher/exams/create')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {exams.map(exam => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex flex-col space-y-4">
                    {/* Title and status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <CardTitle className="text-lg md:text-xl break-words">{exam.title}</CardTitle>
                          {getStatusBadge(exam.status, exam.dynamicStatus)}
                        </div>
                        {exam.description && (
                          <CardDescription className="mb-2 text-sm">
                            {exam.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>

                    {/* Debug info - mobile friendly */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">
                        Attempts: {exam.studentsAttempted}
                      </Badge>
                      <Badge variant="outline">
                        Results: {exam.studentsCompleted}
                      </Badge>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col space-y-2 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{exam.subject?.name || 'General'}</span>
                        </div>
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {exam.class
                              ? `${exam.class.name} ${exam.class.section || ''}`
                              : 'All Classes'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                          {exam.duration} min
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                          {exam.studentsAttempted} attempted
                        </div>
                      </div>
                    </div>

                    {/* Action buttons - wrapped for mobile */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                      >
                        <Eye className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>

                      {exam.studentsAttempted > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            router.push(`/teacher/exams/${exam.id}/results`)
                          }
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <BarChart3 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Results ({exam.studentsAttempted})</span>
                          <span className="sm:hidden">Results</span>
                        </Button>
                      )}
                      {canEdit(exam) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/teacher/exams/${exam.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      )}
                      {canSubmitForApproval(exam) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            handleSubmitForApproval(exam.id, exam.title)
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Submit</span>
                        </Button>
                      )}
                      {canDelete(exam) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                        >
                          <Trash2 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Exam Details</p>
                      <p className="text-gray-600">
                        {exam.totalQuestions} questions • {exam.totalMarks}{' '}
                        marks
                      </p>
                      {exam.passingMarks && (
                        <p className="text-gray-600">
                          Passing: {exam.passingMarks} marks
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Schedule</p>
                      <p className="text-gray-600">
                        Start: {formatDateTime(exam.startTime)}
                      </p>
                      <p className="text-gray-600">
                        End: {formatDateTime(exam.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Statistics</p>
                      <p className="text-gray-600">
                        Attempted: {exam.studentsAttempted}
                      </p>
                      <p className="text-gray-600">
                        Completed: {exam.studentsCompleted}
                      </p>
                      {exam.approver && (
                        <p className="text-gray-600">
                          Approved by: {exam.approver.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {exam.status === 'REJECTED' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        <strong>Rejection Reason:</strong> This exam was
                        rejected by the admin. Please review and resubmit.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:justify-center items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination(prev => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <span className="py-2 px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() =>
                setPagination(prev => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </TeacherDashboardLayout>
  );
}
