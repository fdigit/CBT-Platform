'use client';

import {
    AlertCircle,
    BarChart3,
    CheckCircle,
    Clock,
    Download,
    List,
    RefreshCw,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../../../components/ui/tabs';

interface ExamData {
  id: string;
  title: string;
  description?: string;
  school: {
    id: string;
    name: string;
    status: string;
  };
  startTime: string;
  endTime: string;
  duration: number;
  examStatus: string;
  examType: string;
  registeredStudents: number;
  totalQuestions: number;
  totalPoints: number;
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SummaryStats {
  totalExams: number;
  activeExams: number;
  scheduledExams: number;
  closedExams: number;
  pendingApprovals: number;
}

interface ExamFiltersType {
  search: string;
  status: string;
  examType: string;
  schoolId: string;
  startDate: string;
  endDate: string;
}

// Simple inline components to avoid import issues
const ExamSummaryStats = ({ stats }: { stats: SummaryStats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium">Total Exams</CardTitle>
        <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="text-xl md:text-2xl font-bold">{stats.totalExams}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium">Active</CardTitle>
        <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="text-xl md:text-2xl font-bold text-green-600">
          {stats.activeExams}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium">Scheduled</CardTitle>
        <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="text-xl md:text-2xl font-bold text-blue-600">
          {stats.scheduledExams}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium">Closed</CardTitle>
        <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="text-xl md:text-2xl font-bold text-gray-600">
          {stats.closedExams}
        </div>
      </CardContent>
    </Card>
    <Card className="col-span-2 sm:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium">Pending</CardTitle>
        <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="text-xl md:text-2xl font-bold text-orange-600">
          {stats.pendingApprovals}
        </div>
      </CardContent>
    </Card>
  </div>
);

const ExamFilters = ({
  onFiltersChange,
  schools,
}: {
  onFiltersChange: (filters: ExamFiltersType) => void;
  schools: Array<{ id: string; name: string }>;
}) => {
  const [filters, setFilters] = useState<ExamFiltersType>({
    search: '',
    status: '',
    examType: '',
    schoolId: '',
    startDate: '',
    endDate: '',
  });

  const handleFilterChange = (key: keyof ExamFiltersType, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">Filters</CardTitle>
        <CardDescription className="text-xs md:text-sm">Filter exams by various criteria</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Search</label>
            <input
              type="text"
              placeholder="Search exams..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">School</label>
            <select
              value={filters.schoolId}
              onChange={e => handleFilterChange('schoolId', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Schools</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ExamTable = ({
  exams,
  pagination,
  onPageChange,
  loading,
}: {
  exams: ExamData[];
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading exams...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exams</CardTitle>
        <CardDescription>All exams across schools</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No exams found</div>
          ) : (
            <div className="space-y-2">
              {exams.map(exam => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{exam.title}</h3>
                    <p className="text-sm text-gray-600">{exam.school.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{exam.examStatus}</Badge>
                      <Badge variant="secondary">{exam.examType}</Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{exam.registeredStudents} students</div>
                    <div>{exam.totalQuestions} questions</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simple pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ExamAnalytics = () => (
  <Card>
    <CardHeader>
      <CardTitle>Analytics</CardTitle>
      <CardDescription>Exam analytics and insights</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8 text-gray-500">
        Analytics coming soon...
      </div>
    </CardContent>
  </Card>
);

export default function ExamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [exams, setExams] = useState<ExamData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalExams: 0,
    activeExams: 0,
    scheduledExams: 0,
    closedExams: 0,
    pendingApprovals: 0,
  });
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ExamFiltersType>({
    search: '',
    status: '',
    examType: '',
    schoolId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch exams data
  const fetchExams = useCallback(
    async (page = 1, currentFilters = filters) => {
      try {
        setLoading(page === 1);
        setRefreshing(page !== 1);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...Object.fromEntries(
            Object.entries(currentFilters).filter(([_, value]) => value !== '')
          ),
        });

        const response = await fetch(`/api/admin/exams?${params}`);
        const data = await response.json();

        if (response.ok) {
          setExams(data.exams);
          setPagination(data.pagination);
        } else {
          console.error('Failed to fetch exams:', data.message);
        }
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/exams/analytics');
      const data = await response.json();

      if (response.ok) {
        setSummaryStats(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, []);

  // Fetch schools list
  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/schools');
      const data = await response.json();

      if (response.ok) {
        setSchools(
          data.schools?.map((school: any) => ({
            id: school.id,
            name: school.name,
          })) || []
        );
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (session?.user.role === 'SUPER_ADMIN') {
      fetchExams(1);
      fetchAnalytics();
      fetchSchools();
    }
  }, [session, fetchExams, fetchAnalytics, fetchSchools]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: ExamFiltersType) => {
      setFilters(newFilters);
      fetchExams(1, newFilters);
    },
    [fetchExams]
  );

  // Handle page changes
  const handlePageChange = useCallback(
    (page: number) => {
      fetchExams(page);
    },
    [fetchExams]
  );

  // Handle bulk actions
  const handleBulkAction = useCallback(
    async (examIds: string[], action: string, reason?: string) => {
      try {
        const response = await fetch('/api/admin/exams/bulk-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ examIds, action, reason }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Success:', data.message);
          fetchExams(pagination.currentPage);
          fetchAnalytics();
        } else {
          console.error('Error:', data.message || `Failed to ${action} exams`);
        }
      } catch (error) {
        console.error('Error:', `Failed to ${action} exams`);
      }
    },
    [pagination.currentPage, fetchExams, fetchAnalytics]
  );

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        export: 'csv',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      });

      const response = await fetch(`/api/admin/exams/export?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `exams-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('Exams data exported successfully');
      } else {
        console.error('Failed to export data');
      }
    } catch (error) {
      console.error('Failed to export data');
    }
  }, [filters]);

  // Loading screen
  if (status === 'loading' || (loading && exams.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthorized screen
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Exams Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Monitor and manage all exams across schools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchExams(pagination.currentPage)}
              disabled={refreshing}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} sm:mr-2`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              size="sm"
              onClick={handleExport} 
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <ExamSummaryStats stats={summaryStats} />

        {/* Main Content with Tabs */}
        <Tabs defaultValue="exams" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="exams" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
              <List className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Exam Management</span>
              <span className="sm:hidden">Exams</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Analytics & Insights</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-6">
            {/* Filters */}
            <ExamFilters
              onFiltersChange={handleFiltersChange}
              schools={schools}
            />

            {/* Exams Table */}
            <ExamTable
              exams={exams}
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ExamAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
