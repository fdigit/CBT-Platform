'use client';

import { Role } from '@/lib/auth';
import {
  Award,
  BarChart3,
  BookOpen,
  Download,
  FileText,
  Filter,
  Search,
  Target,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '../../../components/dashboard';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';

interface Result {
  id: string;
  studentName: string;
  admissionNumber: string;
  class: string;
  subject: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  teacher: string;
  examDate: string;
  gradedAt: string;
}

interface Analytics {
  overview: {
    totalResults: number;
    totalStudents: number;
    totalExams: number;
    averageScore: number;
    passRate: number;
  };
  gradeDistribution: Record<string, number>;
  subjectPerformance: Array<{
    subject: string;
    averageScore: number;
    totalStudents: number;
    totalExams: number;
  }>;
  teacherPerformance: Array<{
    teacher: string;
    averageScore: number;
    totalStudents: number;
    totalExams: number;
  }>;
  classPerformance: Array<{
    className: string;
    averageScore: number;
    totalStudents: number;
    totalExams: number;
  }>;
}

export default function AdminResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    examType: '',
    dateFrom: '',
    dateTo: '',
    grade: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (
      !session ||
      ![Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(session.user.role)
    ) {
      router.push('/auth/signin');
      return;
    }

    fetchResults();
    fetchAnalytics();
  }, [session, status, router, pagination.page, filters]);

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.classId &&
          filters.classId !== 'all' && { classId: filters.classId }),
        ...(filters.subjectId &&
          filters.subjectId !== 'all' && { subjectId: filters.subjectId }),
        ...(filters.teacherId &&
          filters.teacherId !== 'all' && { teacherId: filters.teacherId }),
        ...(filters.examType &&
          filters.examType !== 'all' && { examType: filters.examType }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.grade &&
          filters.grade !== 'all' && { grade: filters.grade }),
      });

      const response = await fetch(`/api/admin/results?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.classId &&
          filters.classId !== 'all' && { classId: filters.classId }),
        ...(filters.subjectId &&
          filters.subjectId !== 'all' && { subjectId: filters.subjectId }),
        ...(filters.teacherId &&
          filters.teacherId !== 'all' && { teacherId: filters.teacherId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/admin/results/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchResults();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    // TODO: Implement export functionality
    console.log(`Exporting results as ${format}`);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (
    !session ||
    ![Role.SUPER_ADMIN, Role.SCHOOL_ADMIN].includes(session.user.role)
  ) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Results Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              View and analyze exam results across all schools
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => handleExport('pdf')}
            >
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => handleExport('excel')}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Excel</span>
              <span className="sm:hidden">XLS</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => handleExport('csv')}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Students
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {analytics.overview.totalStudents}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Exams
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {analytics.overview.totalExams}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Target className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Avg Score
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {analytics.overview.averageScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Award className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Pass Rate
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {analytics.overview.passRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                  <div className="sm:ml-2 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Results
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {analytics.overview.totalResults}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="results" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md h-auto">
            <TabsTrigger value="results" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Results Table</span>
              <span className="sm:hidden">Results</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4 md:space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center text-base md:text-lg">
                  <Filter className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Search students, exams..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                      <Button onClick={handleSearch}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Class</label>
                    <Select
                      value={filters.classId}
                      onValueChange={value =>
                        handleFilterChange('classId', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {/* TODO: Populate with actual classes */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Select
                      value={filters.subjectId}
                      onValueChange={value =>
                        handleFilterChange('subjectId', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {/* TODO: Populate with actual subjects */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Grade</label>
                    <Select
                      value={filters.grade}
                      onValueChange={value =>
                        handleFilterChange('grade', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C+">C+</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Results</CardTitle>
                <CardDescription>
                  Showing {results.length} of {pagination.total} results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission No.</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Exam Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map(result => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            {result.studentName}
                          </TableCell>
                          <TableCell>{result.admissionNumber}</TableCell>
                          <TableCell>{result.class}</TableCell>
                          <TableCell>{result.subject}</TableCell>
                          <TableCell>{result.examTitle}</TableCell>
                          <TableCell>
                            {result.score}/{result.totalMarks}
                          </TableCell>
                          <TableCell>{result.percentage}%</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(result.grade)}>
                              {result.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>{result.teacher}</TableCell>
                          <TableCell>
                            {new Date(result.examDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        disabled={pagination.page === 1}
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={pagination.page === pagination.pages}
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 md:space-y-6">
            {analytics && (
              <>
                {/* Grade Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Grade Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={Object.entries(
                              analytics.gradeDistribution
                            ).map(([grade, count]) => ({
                              name: grade,
                              value: count,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.entries(analytics.gradeDistribution).map(
                              ([grade, count], index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={`hsl(${index * 45}, 70%, 50%)`}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Subject Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.subjectPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="averageScore" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Teacher Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Teacher Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={analytics.teacherPerformance}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="teacher" width={100} />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
