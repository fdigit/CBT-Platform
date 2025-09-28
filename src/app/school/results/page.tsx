'use client';

import { Role } from '@/lib/auth';
import {
  Award,
  BarChart3,
  BookOpen,
  Download,
  FileText,
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
import { SchoolDashboardLayout } from '../../../components/school/SchoolDashboardLayout';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
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
import { useToast } from '../../../hooks/use-toast';
import { generateAllResultsPDF } from '../../../lib/pdf-generator';

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

export default function SchoolResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [results, setResults] = useState<Result[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    classId: '',
    subjectId: '',
    teacherId: '',
    examType: '',
    dateFrom: '',
    dateTo: '',
    grade: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== Role.SCHOOL_ADMIN) {
      router.push('/auth/signin');
      return;
    }

    fetchResults();
    fetchAnalytics();
  }, [session, status, router, currentPage, filters]);

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([_, value]) => value !== '' && value !== 'all'
          )
        ),
      });

      const response = await fetch(`/api/admin/results?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(
            ([_, value]) => value !== '' && value !== 'all'
          )
        )
      );

      const response = await fetch(`/api/admin/results/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExportResults = async () => {
    if (!session?.user?.name || results.length === 0) {
      toast({
        title: 'No Data',
        description: 'No results available to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      await generateAllResultsPDF(results, session.user.name);
      toast({
        title: 'Success',
        description: 'Results PDF downloaded successfully',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
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

  const gradeColors = {
    'A+': '#10b981',
    A: '#10b981',
    'B+': '#3b82f6',
    B: '#3b82f6',
    'C+': '#f59e0b',
    C: '#f59e0b',
    D: '#f97316',
    F: '#ef4444',
  };

  if (status === 'loading' || loading) {
    return (
      <SchoolDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        </div>
      </SchoolDashboardLayout>
    );
  }

  if (!session || session.user.role !== Role.SCHOOL_ADMIN) {
    return null;
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Results Management
            </h1>
            <p className="text-gray-600">
              View and analyze student exam results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleExportResults} className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students, exams, or subjects..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.classId}
            onValueChange={value => handleFilterChange('classId', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {/* TODO: Add dynamic class options */}
            </SelectContent>
          </Select>
          <Select
            value={filters.subjectId}
            onValueChange={value => handleFilterChange('subjectId', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {/* TODO: Add dynamic subject options */}
            </SelectContent>
          </Select>
          <Select
            value={filters.grade}
            onValueChange={value => handleFilterChange('grade', value)}
          >
            <SelectTrigger className="w-40">
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

        {/* Results Table and Analytics */}
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList>
            <TabsTrigger value="results">Results Table</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <Card>
              <CardContent className="p-0">
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
                        <TableCell className="font-mono text-sm">
                          {result.admissionNumber}
                        </TableCell>
                        <TableCell>{result.class}</TableCell>
                        <TableCell>{result.subject}</TableCell>
                        <TableCell>{result.examTitle}</TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {result.score}/{result.totalMarks}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {result.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(result.grade)}>
                            {result.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.teacher}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(result.examDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {results.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No results found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {filters.search
                        ? 'Try adjusting your search criteria.'
                        : 'No results match the selected filters.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
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
          </TabsContent>

          <TabsContent value="analytics">
            {analytics && (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Target className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">
                            Total Results
                          </p>
                          <p className="text-2xl font-bold">
                            {analytics.overview.totalResults}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">
                            Students
                          </p>
                          <p className="text-2xl font-bold">
                            {analytics.overview.totalStudents}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <BookOpen className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">
                            Exams
                          </p>
                          <p className="text-2xl font-bold">
                            {analytics.overview.totalExams}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">
                            Avg Score
                          </p>
                          <p className="text-2xl font-bold">
                            {analytics.overview.averageScore.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Award className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">
                            Pass Rate
                          </p>
                          <p className="text-2xl font-bold">
                            {analytics.overview.passRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Grade Distribution */}
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
                              color:
                                gradeColors[
                                  grade as keyof typeof gradeColors
                                ] || '#6b7280',
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
                                  fill={
                                    gradeColors[
                                      grade as keyof typeof gradeColors
                                    ] || '#6b7280'
                                  }
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Subject Performance */}
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
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SchoolDashboardLayout>
  );
}
