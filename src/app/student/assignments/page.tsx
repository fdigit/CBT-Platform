'use client';

import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Filter,
  Package,
  Search,
  Send,
  StickyNote,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentDashboardLayout } from '../../../components/student';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { FileUpload, UploadedFile } from '../../../components/ui/file-upload';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  class: string;
  description: string;
  instructions: string;
  dueDate: string | null;
  createdAt: string;
  type:
    | 'ASSIGNMENT'
    | 'NOTE'
    | 'RESOURCE'
    | 'HOMEWORK'
    | 'PROJECT'
    | 'QUIZ'
    | 'TEST';
  maxScore: number;
  teacherName: string;
  attachments: {
    id: string;
    name: string;
    url: string;
    size: string;
  }[];
  submission?: {
    id: string;
    status: 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED' | 'MISSING';
    submittedAt?: string;
    score?: number;
    feedback?: string;
    attachments: {
      id: string;
      name: string;
      url: string;
    }[];
  } | null;
}

interface SubmissionForm {
  textContent: string;
  files: UploadedFile[];
}

export default function StudentAssignments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const [submissionForm, setSubmissionForm] = useState<SubmissionForm>({
    textContent: '',
    files: [],
  });
  const [submissionFiles, setSubmissionFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin');
      return;
    }

    fetchAssignments();
  }, [session, status, router]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/assignments');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched student assignments:', data.assignments);
        setAssignments(data.assignments || []);
      } else {
        console.error('Failed to fetch assignments:', response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setAssignments([]);
        toast({
          title: 'Error',
          description: 'Failed to load assignments',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      ASSIGNMENT: ClipboardList,
      NOTE: StickyNote,
      RESOURCE: Package,
      HOMEWORK: BookOpen,
      PROJECT: FileText,
      QUIZ: AlertCircle,
      TEST: CheckCircle,
    };
    const Icon = icons[type as keyof typeof icons] || ClipboardList;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      ASSIGNMENT: 'bg-blue-100 text-blue-800',
      NOTE: 'bg-green-100 text-green-800',
      RESOURCE: 'bg-orange-100 text-orange-800',
      HOMEWORK: 'bg-blue-100 text-blue-800',
      PROJECT: 'bg-purple-100 text-purple-800',
      QUIZ: 'bg-yellow-100 text-yellow-800',
      TEST: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={colors[type as keyof typeof colors]}>
        {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const getSubmissionStatusBadge = (status?: string) => {
    if (!status)
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600">
          Not Submitted
        </Badge>
      );

    switch (status) {
      case 'GRADED':
        return (
          <Badge variant="default" className="bg-green-600">
            Graded
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Submitted
          </Badge>
        );
      case 'LATE':
        return <Badge variant="destructive">Late</Badge>;
      case 'MISSING':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Missing
          </Badge>
        );
      case 'RETURNED':
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            Returned
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const diffInDays = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 3600 * 24)
    );

    if (diffInDays < 0) {
      return {
        status: 'overdue',
        text: `Overdue by ${Math.abs(diffInDays)} day(s)`,
        color: 'text-red-600',
      };
    } else if (diffInDays === 0) {
      return { status: 'today', text: 'Due today', color: 'text-orange-600' };
    } else if (diffInDays <= 3) {
      return {
        status: 'soon',
        text: `Due in ${diffInDays} day(s)`,
        color: 'text-yellow-600',
      };
    } else {
      return {
        status: 'upcoming',
        text: `Due in ${diffInDays} day(s)`,
        color: 'text-gray-600',
      };
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' || assignment.type.toLowerCase() === filterType;
    const matchesSubject =
      filterSubject === 'all' || assignment.subject === filterSubject;

    let matchesStatus = true;
    if (filterStatus === 'submitted') {
      matchesStatus = !!assignment.submission;
    } else if (filterStatus === 'pending') {
      matchesStatus =
        !assignment.submission &&
        ['ASSIGNMENT', 'HOMEWORK', 'PROJECT', 'QUIZ', 'TEST'].includes(
          assignment.type
        );
    } else if (filterStatus === 'graded') {
      matchesStatus = assignment.submission?.status === 'GRADED';
    }

    // Tab filtering
    if (activeTab === 'assignments') {
      matchesStatus =
        matchesStatus &&
        ['ASSIGNMENT', 'HOMEWORK', 'PROJECT', 'QUIZ', 'TEST'].includes(
          assignment.type
        );
    } else if (activeTab === 'notes') {
      matchesStatus = matchesStatus && assignment.type === 'NOTE';
    } else if (activeTab === 'resources') {
      matchesStatus = matchesStatus && assignment.type === 'RESOURCE';
    }

    return matchesSearch && matchesType && matchesSubject && matchesStatus;
  });

  const handleDownload = async (attachment: { url: string; name: string }) => {
    try {
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download Started',
        description: `Downloading ${attachment.name}`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the file',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadAll = async (
    attachments: { url: string; name: string }[]
  ) => {
    try {
      for (const attachment of attachments) {
        await handleDownload(attachment);
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download some files',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    try {
      if (!submissionForm.textContent && submissionFiles.length === 0) {
        toast({
          title: 'Error',
          description: 'Please provide either text content or file attachments',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `/api/student/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            textContent: submissionForm.textContent,
            attachments: submissionFiles.map(file => ({
              fileName: file.id,
              originalName: file.name,
              filePath: file.url,
              fileSize: file.size,
              mimeType: file.type,
            })),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit assignment');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: data.message || 'Assignment submitted successfully',
      });
      setIsSubmissionModalOpen(false);
      setSubmissionForm({ textContent: '', files: [] });
      setSubmissionFiles([]);
      // Refresh assignments to show updated submission status
      await fetchAssignments();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to submit assignment',
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

  if (!session || session.user.role !== 'STUDENT') {
    return null;
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Assignments & Notes
            </h1>
            <p className="text-gray-600 mt-1">
              View and submit your assignments, notes, and resources
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assignments, notes, or resources..."
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
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignments Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map(assignment => {
                const dueDateStatus = getDueDateStatus(assignment.dueDate);
                const isSubmittable = [
                  'ASSIGNMENT',
                  'HOMEWORK',
                  'PROJECT',
                  'QUIZ',
                  'TEST',
                ].includes(assignment.type);

                return (
                  <Card
                    key={assignment.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {assignment.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.subject} • {assignment.teacherName}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1">
                              {getTypeIcon(assignment.type)}
                              {getTypeBadge(assignment.type)}
                            </div>
                            {isSubmittable &&
                              getSubmissionStatusBadge(
                                assignment.submission?.status
                              )}
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
                            <div className="text-right">
                              <div className="font-medium">
                                {assignment.dueDate}
                              </div>
                              {dueDateStatus && (
                                <div
                                  className={`text-xs ${dueDateStatus.color}`}
                                >
                                  {dueDateStatus.text}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {isSubmittable && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Max Score:</span>
                            <span className="font-medium">
                              {assignment.maxScore} pts
                            </span>
                          </div>
                        )}
                        {assignment.attachments.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Attachments:</span>
                            <span className="font-medium">
                              {assignment.attachments.length} file(s)
                            </span>
                          </div>
                        )}
                        {assignment.submission?.score !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Score:</span>
                            <span className="font-medium text-green-600">
                              {assignment.submission.score}/
                              {assignment.maxScore} pts
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Submission Status */}
                      {assignment.submission?.submittedAt && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-800">
                              Submitted on{' '}
                              {new Date(
                                assignment.submission.submittedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Due Date Warning */}
                      {dueDateStatus &&
                        (dueDateStatus.status === 'today' ||
                          dueDateStatus.status === 'soon') &&
                        !assignment.submission && (
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center space-x-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-yellow-800">
                                {dueDateStatus.text}
                              </span>
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
                              setSelectedAssignment(assignment);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {assignment.attachments.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (assignment.attachments.length === 1) {
                                  handleDownload(assignment.attachments[0]);
                                } else {
                                  handleDownloadAll(assignment.attachments);
                                }
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download{' '}
                              {assignment.attachments.length > 1
                                ? `(${assignment.attachments.length})`
                                : ''}
                            </Button>
                          )}
                        </div>
                        {isSubmittable && !assignment.submission && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsSubmissionModalOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No {activeTab === 'all' ? 'items' : activeTab} found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search criteria.'
                    : `No ${activeTab === 'all' ? 'assignments, notes, or resources' : activeTab} available at the moment.`}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Assignment Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            {selectedAssignment && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    {getTypeIcon(selectedAssignment.type)}
                    <span>{selectedAssignment.title}</span>
                  </DialogTitle>
                  <DialogDescription>
                    {selectedAssignment.subject} •{' '}
                    {selectedAssignment.teacherName}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Type</Label>
                      <div className="mt-1">
                        {getTypeBadge(selectedAssignment.type)}
                      </div>
                    </div>
                    {selectedAssignment.dueDate && (
                      <div>
                        <Label className="text-sm font-medium">Due Date</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedAssignment.dueDate}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedAssignment.description}
                    </p>
                  </div>

                  {/* Instructions/Content */}
                  <div>
                    <Label className="text-sm font-medium">
                      {selectedAssignment.type === 'NOTE'
                        ? 'Note Content'
                        : selectedAssignment.type === 'RESOURCE'
                          ? 'Resource Details'
                          : 'Instructions'}
                    </Label>
                    <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                      {selectedAssignment.instructions}
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedAssignment.attachments.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Attachments</Label>
                      <div className="mt-2 space-y-2">
                        {selectedAssignment.attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                {attachment.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({attachment.size})
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(attachment)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Info */}
                  {selectedAssignment.submission && (
                    <div>
                      <Label className="text-sm font-medium">
                        Your Submission
                      </Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getSubmissionStatusBadge(
                            selectedAssignment.submission.status
                          )}
                        </div>
                        {selectedAssignment.submission.submittedAt && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Submitted:
                            </span>
                            <span className="text-sm font-medium">
                              {new Date(
                                selectedAssignment.submission.submittedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedAssignment.submission.score !== undefined && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Score:
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              {selectedAssignment.submission.score}/
                              {selectedAssignment.maxScore} pts
                            </span>
                          </div>
                        )}
                        {selectedAssignment.submission.feedback && (
                          <div className="mt-3">
                            <span className="text-sm text-gray-600">
                              Feedback:
                            </span>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedAssignment.submission.feedback}
                            </p>
                          </div>
                        )}
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
                  {[
                    'assignment',
                    'homework',
                    'project',
                    'quiz',
                    'test',
                  ].includes(selectedAssignment.type) &&
                    !selectedAssignment.submission && (
                      <Button
                        onClick={() => {
                          setIsViewModalOpen(false);
                          setIsSubmissionModalOpen(true);
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Assignment
                      </Button>
                    )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Submission Modal */}
        <Dialog
          open={isSubmissionModalOpen}
          onOpenChange={setIsSubmissionModalOpen}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedAssignment && (
              <>
                <DialogHeader>
                  <DialogTitle>Submit Assignment</DialogTitle>
                  <DialogDescription>
                    Submit your work for &quot;{selectedAssignment.title}&quot;
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="textContent">
                      Written Response (Optional)
                    </Label>
                    <Textarea
                      id="textContent"
                      value={submissionForm.textContent}
                      onChange={e =>
                        setSubmissionForm(prev => ({
                          ...prev,
                          textContent: e.target.value,
                        }))
                      }
                      placeholder="Enter your written response here..."
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>File Attachments</Label>
                    <FileUpload
                      onUpload={files =>
                        setSubmissionFiles(prev => [...prev, ...files])
                      }
                      onRemove={file =>
                        setSubmissionFiles(prev =>
                          prev.filter(f => f.id !== file.id)
                        )
                      }
                      uploadEndpoint="/api/upload/temp-file"
                      existingFiles={submissionFiles}
                      maxFiles={5}
                      maxSize={10}
                      acceptedTypes={[
                        'pdf',
                        'doc',
                        'docx',
                        'txt',
                        'jpg',
                        'jpeg',
                        'png',
                      ]}
                      label="Upload Your Work"
                      description="Upload your assignment files here"
                      additionalData={{
                        uploadType: 'submission',
                      }}
                    />
                  </div>

                  {selectedAssignment.dueDate && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-800">
                          Due: {selectedAssignment.dueDate}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSubmissionModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => handleSubmit(selectedAssignment.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StudentDashboardLayout>
  );
}
