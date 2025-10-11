'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Award,
  BarChart3,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Analytics {
  totalResults: number;
  totalStudents: number;
  averageGPA: number;
  passRate: number;
  topPerformers: Array<{
    studentName: string;
    gpa: number;
  }>;
  subjectPerformance: Array<{
    subjectName: string;
    average: number;
    passRate: number;
    totalResults: number;
  }>;
  classPerformance: Array<{
    className: string;
    average: number;
    passRate: number;
  }>;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
}

export default function AdminAcademicResultsAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  const [terms, setTerms] = useState<string[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

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
  }, [session, status, router]);

  useEffect(() => {
    if (selectedTerm && selectedSession) {
      fetchAnalytics();
    }
  }, [selectedTerm, selectedSession, selectedClass]);

  const fetchFilterOptions = async () => {
    try {
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

        const current = termData.termSessions?.find((ts: any) => ts.isCurrent);
        if (current) {
          setSelectedTerm(current.term);
          setSelectedSession(current.session);
        }
      }

      const classesResponse = await fetch('/api/school/classes');
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedTerm || !selectedSession) return;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        term: selectedTerm,
        session: selectedSession,
      });

      if (selectedClass) {
        params.append('classId', selectedClass);
      }

      const response = await fetch(
        `/api/admin/academic-results/analytics?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch analytics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  const gradeColors: { [key: string]: string } = {
    'A*': '#10b981',
    A: '#3b82f6',
    'B+': '#8b5cf6',
    B: '#f59e0b',
    C: '#f97316',
    D: '#ef4444',
    F: '#dc2626',
  };

  return (
    <LayoutComponent>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/academic-results')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Results Analytics
              </h1>
            </div>
            <p className="text-gray-600 mt-2">
              Performance insights and trends across your school
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Period</CardTitle>
            <CardDescription>
              Choose term and session to view analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map(term => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Session</label>
                <Select
                  value={selectedSession}
                  onValueChange={setSelectedSession}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(session => (
                      <SelectItem key={session} value={session}>
                        {session}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Class (Optional)</label>
                <Select
                  value={selectedClass || 'all'}
                  onValueChange={value =>
                    setSelectedClass(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        Students
                      </p>
                      <p className="text-2xl font-bold">
                        {analytics.totalStudents}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        Results
                      </p>
                      <p className="text-2xl font-bold">
                        {analytics.totalResults}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        Avg GPA
                      </p>
                      <p className="text-2xl font-bold">
                        {analytics.averageGPA.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        Pass Rate
                      </p>
                      <p className="text-2xl font-bold">
                        {analytics.passRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Average scores by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.subjectPerformance}>
                      <XAxis
                        dataKey="subjectName"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar
                        dataKey="average"
                        fill="#3b82f6"
                        name="Average Score"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of grades across all results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.gradeDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ grade, count }) => `${grade}: ${count}`}
                      >
                        {analytics.gradeDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={gradeColors[entry.grade] || '#6b7280'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {analytics.classPerformance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Class Performance</CardTitle>
                    <CardDescription>Average scores by class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.classPerformance}>
                        <XAxis dataKey="className" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar
                          dataKey="average"
                          fill="#10b981"
                          name="Average Score"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest GPA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topPerformers
                      .slice(0, 5)
                      .map((student, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">
                                {student.studentName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {student.gpa.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">GPA</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Subject Performance</CardTitle>
                <CardDescription>
                  Performance metrics for each subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                          Average Score
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                          Pass Rate
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                          Total Results
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {analytics.subjectPerformance.map((subject, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{subject.subjectName}</td>
                          <td className="px-4 py-3 text-center font-medium">
                            {subject.average.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subject.passRate >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : subject.passRate >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {subject.passRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {subject.totalResults}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select Term and Session
                </h3>
                <p className="text-gray-600">
                  Choose a term and session to view analytics
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutComponent>
  );
}
