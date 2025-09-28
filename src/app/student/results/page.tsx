'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  const [loading, setLoading] = useState(true);
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
  }, [session, status, router]);

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

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Results</h1>
            <p className="text-gray-600 mt-2">
              Track your exam performance and progress over time
            </p>
          </div>
          <Button
            onClick={() => handleDownloadPDF('all')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Trend</span>
                </CardTitle>
                <CardDescription>
                  Your score progression over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>
                  Average scores by subject area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Breakdown of your exam grades</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
              <CardHeader>
                <CardTitle>Monthly Progress</CardTitle>
                <CardDescription>Exams completed each month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
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
            <CardDescription>
              {examFilter
                ? 'Results filtered by selected exam'
                : 'Complete history of your exam results'}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
