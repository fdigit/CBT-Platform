'use client';

import {
  AcademicResultsTable,
  GPASummaryCard,
} from '@/components/student/academic-results';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getOverallGradeFromGPA } from '@/lib/grading';
import {
  Award,
  BarChart3,
  Download,
  FileText,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ResultsTable,
  StatsCard,
  StudentDashboardLayout,
} from '../../../components/student';
import { useToast } from '../../../hooks/use-toast';
import {
  generateAllResultsPDF,
  generateResultPDF,
} from '../../../lib/pdf-generator';

interface Result {
  id: string;
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  teacherRemark: string;
  examDate: string;
  gradedAt: string;
  teacher: string;
}

interface PerformanceData {
  month: string;
  score: number;
  average: number;
}

interface SubjectPerformance {
  subject: string;
  average: number;
  exams: number;
}

interface GradeDistribution {
  grade: string;
  count: number;
  color: string;
}

function ResultsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examFilter = searchParams.get('exam');

  const [results, setResults] = useState<Result[]>([]);
  const [academicResults, setAcademicResults] = useState<any[]>([]);
  const [gpa, setGpa] = useState<number>(0);
  const [totalGradePoints, setTotalGradePoints] = useState<number>(0);
  const [numberOfSubjects, setNumberOfSubjects] = useState<number>(0);
  const [classAverage, setClassAverage] = useState<number | null>(null);
  const [availableTerms, setAvailableTerms] = useState<
    Array<{ term: string; session: string }>
  >([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingAcademic, setLoadingAcademic] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectPerformance[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<
    GradeDistribution[]
  >([]);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin');
      return;
    }

    fetchResults();
    fetchAcademicResults();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedTerm && selectedSession) {
      fetchAcademicResults();
    }
  }, [selectedTerm, selectedSession]);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/student/results');
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        processChartData(data.results || []);
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

  const processChartData = (resultsData: Result[]) => {
    // Performance over time
    const monthlyData: { [key: string]: { scores: number[]; count: number } } =
      {};

    resultsData.forEach(result => {
      const month = new Date(result.examDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });

      if (!monthlyData[month]) {
        monthlyData[month] = { scores: [], count: 0 };
      }

      monthlyData[month].scores.push(result.percentage);
      monthlyData[month].count++;
    });

    const performanceChart = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        score: Math.round(
          data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        ),
        average: 75, // Mock average
      }))
      .slice(-6); // Last 6 months

    setPerformanceData(performanceChart);

    // Subject performance
    const subjectPerf: { [key: string]: { scores: number[]; count: number } } =
      {};

    resultsData.forEach(result => {
      if (!subjectPerf[result.subject]) {
        subjectPerf[result.subject] = { scores: [], count: 0 };
      }
      subjectPerf[result.subject].scores.push(result.percentage);
      subjectPerf[result.subject].count++;
    });

    const subjectChart = Object.entries(subjectPerf).map(([subject, data]) => ({
      subject,
      average: Math.round(
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      ),
      exams: data.count,
    }));

    setSubjectData(subjectChart);

    // Grade distribution
    const gradeCount: { [key: string]: number } = {};
    resultsData.forEach(result => {
      gradeCount[result.grade] = (gradeCount[result.grade] || 0) + 1;
    });

    const gradeColors = {
      'A+': '#10b981',
      A: '#10b981',
      'B+': '#3b82f6',
      B: '#3b82f6',
      'C+': '#f59e0b',
      C: '#f59e0b',
      D: '#ef4444',
      F: '#dc2626',
    };

    const gradeChart = Object.entries(gradeCount).map(([grade, count]) => ({
      grade,
      count,
      color: gradeColors[grade as keyof typeof gradeColors] || '#6b7280',
    }));

    setGradeDistribution(gradeChart);
  };

  const fetchAcademicResults = async () => {
    setLoadingAcademic(true);

    try {
      const params = new URLSearchParams();
      if (selectedTerm) params.append('term', selectedTerm);
      if (selectedSession) params.append('session', selectedSession);

      const response = await fetch(
        `/api/student/academic-results?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setAcademicResults(data.results || []);
        setGpa(data.gpa || 0);
        setTotalGradePoints(data.totalGradePoints || 0);
        setNumberOfSubjects(data.numberOfSubjects || 0);
        setClassAverage(data.classAverage || null);
        setAvailableTerms(data.availableTerms || []);

        if (
          !selectedTerm &&
          data.availableTerms &&
          data.availableTerms.length > 0
        ) {
          setSelectedTerm(data.availableTerms[0].term);
          setSelectedSession(data.availableTerms[0].session);
        }
      }
    } catch (error) {
      console.error('Error fetching academic results:', error);
    } finally {
      setLoadingAcademic(false);
    }
  };

  const handleDownloadResultSlip = async () => {
    if (!selectedTerm || !selectedSession) {
      toast({
        title: 'Error',
        description: 'Please select term and session',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/student/academic-results/pdf?term=${selectedTerm}&session=${selectedSession}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Result_${selectedTerm}_${selectedSession}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Result slip downloaded successfully',
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate result slip',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while downloading result slip',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async (resultId: string) => {
    if (!session?.user?.name) return;

    try {
      if (resultId === 'all') {
        // Download all results
        await generateAllResultsPDF(results, session.user.name);
        toast({
          title: 'Success',
          description: 'Complete results PDF downloaded successfully',
        });
      } else {
        // Download individual result
        const result = results.find(r => r.id === resultId);
        if (result) {
          await generateResultPDF(result, session.user.name);
          toast({
            title: 'Success',
            description: 'Result PDF downloaded successfully',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (resultId: string) => {
    router.push(`/student/results/${resultId}`);
  };

  const calculateStats = () => {
    if (results.length === 0) return { avg: 0, highest: 0, passed: 0 };

    const avg = Math.round(
      results.reduce((sum, r) => sum + r.percentage, 0) / results.length
    );
    const highest = Math.max(...results.map(r => r.percentage));
    const passed = results.filter(r => r.passed).length;

    return { avg, highest, passed };
  };

  if (status === 'loading' || loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  const stats = calculateStats();
  const filteredResults = examFilter
    ? results.filter(r => r.id === examFilter)
    : results;

  const overallGrade = getOverallGradeFromGPA(gpa);

  return (
    <StudentDashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Results
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Track your exam performance, academic results, and progress
            </p>
          </div>
        </div>

        <Tabs defaultValue="academic" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md h-auto">
            <TabsTrigger value="academic" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Academic Results</span>
              <span className="sm:hidden">Academic</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Exam Results (CBT)</span>
              <span className="sm:hidden">CBT Exams</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="academic" className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(availableTerms.map(t => t.term))).map(
                        term => (
                          <SelectItem key={term} value={term}>
                            {term}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Session</label>
                  <Select
                    value={selectedSession}
                    onValueChange={setSelectedSession}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        new Set(availableTerms.map(t => t.session))
                      ).map(session => (
                        <SelectItem key={session} value={session}>
                          {session}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTerm &&
                selectedSession &&
                academicResults.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleDownloadResultSlip}
                    className="gap-2 w-full sm:w-auto"
                    disabled={loadingAcademic}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      Download Result Slip
                    </span>
                    <span className="sm:hidden">Download</span>
                  </Button>
                )}
            </div>

            {loadingAcademic ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading results...</p>
                </div>
              </div>
            ) : academicResults.length > 0 ? (
              <>
                <GPASummaryCard
                  gpa={gpa}
                  totalGradePoints={totalGradePoints}
                  numberOfSubjects={numberOfSubjects}
                  overallGrade={overallGrade}
                  classAverage={classAverage || undefined}
                />

                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg md:text-xl">
                      Subject Results
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Your CA and Exam scores for {selectedTerm},{' '}
                      {selectedSession}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <AcademicResultsTable results={academicResults} />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Results Available
                    </h3>
                    <p className="text-gray-600">
                      {selectedTerm && selectedSession
                        ? 'No published results for this term and session'
                        : 'Select a term and session to view your results'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="exams" className="space-y-4 md:space-y-6">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => handleDownloadPDF('all')}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download Report</span>
                <span className="sm:hidden">Download</span>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <StatsCard
                title="Average Score"
                value={`${stats.avg}%`}
                description="Overall performance"
                icon={Target}
                trend={{ value: 5, isPositive: stats.avg >= 70 }}
              />
              <StatsCard
                title="Highest Score"
                value={`${stats.highest}%`}
                description="Best performance"
                icon={Award}
              />
              <StatsCard
                title="Exams Passed"
                value={stats.passed}
                description={`Out of ${results.length} total`}
                icon={TrendingUp}
              />
              <StatsCard
                title="Total Exams"
                value={results.length}
                description="Completed exams"
                icon={FileText}
              />
            </div>

            {/* Charts */}
            {results.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Over Time */}
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                      <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                      <span>Performance Trend</span>
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Your score progression over the last 6 months
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#2563eb"
                          strokeWidth={2}
                          name="Your Score"
                        />
                        <Line
                          type="monotone"
                          dataKey="average"
                          stroke="#9ca3af"
                          strokeDasharray="5 5"
                          name="Class Average"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Subject Performance */}
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg">
                      Subject Performance
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Average scores by subject area
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={subjectData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="average" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Grade Distribution */}
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg">
                      Grade Distribution
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Breakdown of your exam grades
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={gradeDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          label={({ grade, count }) => `${grade}: ${count}`}
                        >
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Monthly Progress */}
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg">
                      Monthly Progress
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Exams completed each month
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="score" fill="#10b981" name="Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Results Table */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-lg md:text-xl">
                  <span>Detailed Results</span>
                  {examFilter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/student/results')}
                    >
                      View All Results
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  {examFilter
                    ? 'Results filtered by selected exam'
                    : 'Complete history of your exam results'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {filteredResults.length > 0 ? (
                  <ResultsTable
                    results={filteredResults}
                    onViewDetails={handleViewDetails}
                    onDownloadPDF={handleDownloadPDF}
                  />
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No results available
                    </h3>
                    <p className="text-gray-600">
                      Complete some exams to see your results here
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push('/student/exams')}
                    >
                      Browse Available Exams
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentDashboardLayout>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
