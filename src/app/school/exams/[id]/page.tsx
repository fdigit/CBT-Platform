'use client';

import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Settings,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { useToast } from '../../../../hooks/use-toast';

interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'ESSAY';
  options?: string[];
  correctAnswer?: any;
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  shuffle: boolean;
  negativeMarking: boolean;
  maxAttempts: number;
  createdAt: string;
  questions: Question[];
  _count: {
    results: number;
    answers: number;
  };
}

export default function ExamViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchExam();
  }, [session, status, router, examId]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (response.ok) {
        const examData = await response.json();
        setExam(examData);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch exam details',
          variant: 'destructive',
        });
        router.push('/school/exams');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching exam',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = () => {
    if (!exam) return 'unknown';
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'active';
    return 'completed';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-600 text-white">🔴 LIVE</Badge>;
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Exam not found</p>
          <Button onClick={() => router.push('/school/exams')} className="mt-4">
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  const examStatus = getExamStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/school/exams')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Exams
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {exam.title}
                  </h1>
                  {getStatusBadge(examStatus)}
                </div>
                <p className="text-gray-600">Exam preview and details</p>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/school/exams/${examId}/edit`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Exam
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Exam Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exam Information</CardTitle>
                <CardDescription>
                  Basic details about this examination
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-gray-600 mt-1">{exam.description}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Start Time</p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(exam.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">End Time</p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(exam.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-gray-600">
                        {exam.duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Questions</p>
                      <p className="text-sm text-gray-600">
                        {exam.questions.length} questions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Max Attempts</p>
                      <p className="text-sm text-gray-600">
                        {exam.maxAttempts} attempt
                        {exam.maxAttempts !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Settings</p>
                    <div className="flex space-x-2 mt-1">
                      {exam.shuffle && (
                        <Badge variant="outline">Shuffled</Badge>
                      )}
                      {exam.negativeMarking && (
                        <Badge variant="outline">Negative Marking</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Questions ({exam.questions.length})</CardTitle>
                <CardDescription>
                  Preview of all questions in this exam
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {exam.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{question.type}</Badge>
                        <Badge variant="secondary">
                          {question.points} point
                          {question.points !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{question.text}</p>

                    {question.type === 'MCQ' && question.options && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">
                          Options:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {question.type === 'TRUE_FALSE' && question.options && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">
                          Options:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {question.type === 'ESSAY' && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">
                          Essay Question
                        </p>
                        <p className="text-sm text-gray-600">
                          Students will provide written responses
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exam Statistics</CardTitle>
                <CardDescription>
                  Performance and participation data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Attempts</span>
                  <span className="text-sm text-gray-600">
                    {exam._count.answers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-sm text-gray-600">
                    {exam._count.results}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm text-gray-600">
                    {formatDateTime(exam.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => router.push(`/school/exams/${examId}/edit`)}
                  className="w-full"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Exam
                </Button>
                <Button
                  onClick={() => router.push('/school/exams')}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Exams
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
