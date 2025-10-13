'use client';

import {
  ResultsApprovalTable,
  ResultsFilters,
} from '@/components/admin/academic-results';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SchoolDashboardLayout } from '@/components/school/SchoolDashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  FileText,
  Send,
  Settings,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ResultRow {
  id: string;
  studentName: string;
  regNumber: string;
  subject: string;
  className: string;
  teacherName: string;
  term: string;
  session: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  actualGrade: string;
  gradePoint: number;
  remark?: string;
  status: string;
  teacherComment?: string;
  submittedAt?: string;
}

interface Statistics {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  published: number;
}

export default function AdminAcademicResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [results, setResults] = useState<ResultRow[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [filters, setFilters] = useState<any>({});
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'loading') return;

    if (
      !session ||
      !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)
    ) {
      router.push('/auth/signin');
      return;
    }

    fetchFilterOptions();
    fetchResults();
  }, [session, status, router]);

  useEffect(() => {
    fetchResults();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const classesResponse = await fetch('/api/school/classes');
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      }

      const subjectsResponse = await fetch('/api/school/subjects');
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
      }

      const teachersResponse = await fetch('/api/school/teachers');
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData.teachers || []);
      }

      const termSessionsResponse = await fetch('/api/admin/term-session');
      if (termSessionsResponse.ok) {
        const termData = await termSessionsResponse.json();
        const uniqueTerms = Array.from(
          new Set(termData.termSessions?.map((ts: any) => ts.term) || [])
        ) as string[];
        const uniqueSessions = Array.from(
          new Set(termData.termSessions?.map((ts: any) => ts.session) || [])
        ) as string[];
        setTerms(uniqueTerms);
        setSessions(uniqueSessions);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.classId) params.append('classId', filters.classId);
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.teacherId) params.append('teacherId', filters.teacherId);
      if (filters.term) params.append('term', filters.term);
      if (filters.session) params.append('session', filters.session);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(
        `/api/admin/academic-results?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setStatistics(data.statistics || null);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch results',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching results',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishApproved = async () => {
    const approvedResults = results.filter(r => r.status === 'APPROVED');

    if (approvedResults.length === 0) {
      toast({
        title: 'Info',
        description: 'No approved results to publish',
      });
      return;
    }

    if (
      !confirm(
        `Publish ${approvedResults.length} approved results? Students will be able to view them after publishing.`
      )
    ) {
      return;
    }

    setPublishing(true);

    try {
      const response = await fetch('/api/admin/academic-results/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultIds: approvedResults.map(r => r.id),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
        });
        fetchResults();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to publish results',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while publishing results',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  const isSchoolAdmin = session?.user?.role === 'SCHOOL_ADMIN';
  const LayoutComponent = isSchoolAdmin
    ? SchoolDashboardLayout
    : DashboardLayout;

  if (status === 'loading' || loading) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Academic Results Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Review, approve, and publish student results
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => router.push('/admin/academic-results/settings')}
            >
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => router.push('/admin/academic-results/analytics')}
            >
              <TrendingUp className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <Button
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={handlePublishApproved}
              disabled={publishing || !statistics || statistics.approved === 0}
            >
              <Send className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {publishing
                  ? 'Publishing...'
                  : `Publish ${statistics?.approved || 0}`}
              </span>
              <span className="sm:hidden">Publish</span>
            </Button>
          </div>
        </div>

        {statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <FileText className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Total
                    </p>
                    <p className="text-xl md:text-2xl font-bold">
                      {statistics.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Send className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Submitted
                    </p>
                    <p className="text-xl md:text-2xl font-bold">
                      {statistics.submitted}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Approved
                    </p>
                    <p className="text-xl md:text-2xl font-bold">
                      {statistics.approved}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <XCircle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Rejected
                    </p>
                    <p className="text-xl md:text-2xl font-bold">
                      {statistics.rejected}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-500">
                      Published
                    </p>
                    <p className="text-xl md:text-2xl font-bold">
                      {statistics.published}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filter Results</CardTitle>
            <CardDescription>
              Use filters to narrow down the results you want to view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResultsFilters
              filters={filters}
              onFilterChange={setFilters}
              classes={classes}
              subjects={subjects}
              teachers={teachers}
              terms={terms}
              sessions={sessions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {filters.status === 'SUBMITTED'
                ? 'Results pending your approval'
                : 'All academic results'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResultsApprovalTable results={results} onRefresh={fetchResults} />
          </CardContent>
        </Card>
      </div>
    </LayoutComponent>
  );
}
