'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import {
  StudentDashboardLayout,
  StatsCard,
  ExamCard,
  ResultsTable,
} from '../../components/student';

interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'upcoming' | 'active' | 'completed';
}

interface StudentStats {
  totalExams: number;
  completedExams: number;
  averageScore: number;
  upcomingExams: number;
}

interface Result {
  id: string;
  examTitle: string;
  subject: string;
  score: number;
  totalPoints: number;
  percentage: number;
  grade: string;
  date: string;
  duration: number;
  status: 'passed' | 'failed';
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StudentStats>({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    upcomingExams: 0,
  });
  const [exams, setExams] = useState<Exam[]>([]);
  const [recentResults, setRecentResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin');
      return;
    }

    fetchStudentData();
  }, [session, status, router]);

  const fetchStudentData = async () => {
    try {
      const [statsResponse, examsResponse, resultsResponse] = await Promise.all(
        [
          fetch('/api/student/stats'),
          fetch('/api/student/exams'),
          fetch('/api/student/results'),
        ]
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (examsResponse.ok) {
        const examsData = await examsResponse.json();
        setExams(examsData.exams || []);
      }

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setRecentResults(resultsData.slice(0, 5)); // Show only 5 recent results
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch student data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId: string) => {
    router.push(`/student/exam/${examId}`);
  };

  const getExamStatus = (exam: Exam): 'upcoming' | 'active' | 'completed' => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'active';
    return 'completed';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'completed':
        return <Badge>Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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

  // Get active/ongoing exam for priority display
  const activeExam = Array.isArray(exams)
    ? exams.find(exam => getExamStatus(exam) === 'active')
    : null;

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Welcome back, {session?.user.name || 'Student'}!
                </h1>
                <p className="text-blue-100">
                  Student ID: {session?.user.studentProfile?.regNo || 'N/A'}
                </p>
                <p className="text-blue-100 text-sm mt-1">
                  Ready to continue your learning journey?
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 rounded-full p-4">
                  <BookOpen className="h-8 w-8" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Upcoming Exams"
            value={stats.upcomingExams}
            description="Scheduled for you"
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Completed Exams"
            value={stats.completedExams}
            description="Successfully finished"
            icon={CheckCircle}
          />
          <StatsCard
            title="Average Score"
            value={`${stats.averageScore}%`}
            description="Overall performance"
            icon={Target}
            trend={{
              value: stats.averageScore >= 70 ? 5 : -3,
              isPositive: stats.averageScore >= 70,
            }}
          />
        </div>

        {/* Active/Ongoing Exam Section */}
        {activeExam && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="bg-green-600 rounded-full p-1">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-green-800">
                  Exam Available Now!
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ExamCard
                id={activeExam.id}
                title={activeExam.title}
                description={activeExam.description}
                startTime={activeExam.startTime}
                endTime={activeExam.endTime}
                duration={activeExam.duration}
                status="active"
                onStartExam={handleStartExam}
                className="border-0 bg-transparent shadow-none"
              />
            </CardContent>
          </Card>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <ResultsTable
            results={recentResults}
            limit={5}
            onViewDetails={resultId =>
              router.push(`/student/results/${resultId}`)
            }
            onDownloadPDF={resultId => {
              // TODO: Implement PDF download
              toast({
                title: 'Download',
                description: 'PDF download will be implemented soon',
              });
            }}
          />
        )}

        {/* Available Exams Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Available Exams</CardTitle>
            <CardDescription>
              Your assigned exams and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!Array.isArray(exams) || exams.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No exams available
                </h3>
                <p className="text-gray-600">
                  Check back later for new assignments
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.isArray(exams) &&
                  exams.map(exam => (
                    <ExamCard
                      key={exam.id}
                      id={exam.id}
                      title={exam.title}
                      description={exam.description}
                      startTime={exam.startTime}
                      endTime={exam.endTime}
                      duration={exam.duration}
                      status={getExamStatus(exam)}
                      onStartExam={handleStartExam}
                      onViewResult={examId =>
                        router.push(`/student/results?exam=${examId}`)
                      }
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Tips</CardTitle>
            <CardDescription>
              Important guidelines for optimal exam performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Secure Environment
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Exams run in fullscreen mode with monitoring enabled for
                    security.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Auto-Save</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your answers are automatically saved every 30 seconds.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 rounded-full p-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Time Management</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Monitor the countdown timer and submit before time expires.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentDashboardLayout>
  );
}
