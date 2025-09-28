'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Download,
  FileText,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentDashboardLayout } from '../../../../components/student';
import { useToast } from '../../../../hooks/use-toast';
import { generateResultPDF } from '../../../../lib/pdf-generator';

interface ResultDetail {
  id: string;
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  teacherRemark: string;
  teacher: string;
  examDate: string;
  gradedAt: string;
  examId: string;
  duration?: number;
  questions?: Array<{
    id: string;
    text: string;
    type: string;
    points: number;
    studentAnswer: string;
    correctAnswer: string;
    pointsAwarded: number;
    isCorrect: boolean;
  }>;
}

export default function StudentResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resultId, setResultId] = useState<string | null>(null);
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResultId = async () => {
      const { id } = await params;
      setResultId(id);
    };
    fetchResultId();
  }, [params]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin');
      return;
    }

    if (resultId) {
      fetchResultDetail();
    }
  }, [session, status, router, resultId]);

  const fetchResultDetail = async () => {
    if (!resultId) return;

    try {
      const response = await fetch(`/api/student/results/${resultId}`);

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch result details',
          variant: 'destructive',
        });
        router.push('/student/results');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching result details',
        variant: 'destructive',
      });
      router.push('/student/results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result || !session?.user?.name) return;

    try {
      await generateResultPDF(result, session.user.name);
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (error) {
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

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'bg-blue-100 text-blue-800';
      case 'TRUE_FALSE':
        return 'bg-green-100 text-green-800';
      case 'SHORT_ANSWER':
        return 'bg-yellow-100 text-yellow-800';
      case 'ESSAY':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading result details...</p>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!result) {
    return (
      <StudentDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Result Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The requested result could not be found.
            </p>
            <Button onClick={() => router.push('/student/results')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Result Details
              </h1>
              <p className="text-gray-600">{result.examTitle}</p>
            </div>
          </div>
          <Button onClick={handleDownloadPDF} className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Result Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Score</p>
                  <p className="text-2xl font-bold">
                    {result.score}/{result.totalMarks}
                  </p>
                  <p className="text-sm text-gray-500">
                    {result.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Grade</p>
                  <Badge className={getGradeColor(result.grade)}>
                    {result.grade}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.passed ? 'Passed' : 'Failed'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Subject</p>
                  <p className="text-lg font-semibold">{result.subject}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Teacher</p>
                  <p className="text-lg font-semibold">{result.teacher}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Exam Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Exam Title</p>
                <p className="text-lg font-semibold">{result.examTitle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Exam Date</p>
                <p className="text-lg font-semibold">
                  {new Date(result.examDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Graded On</p>
                <p className="text-lg font-semibold">
                  {new Date(result.gradedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Remark */}
        {result.teacherRemark && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Teacher's Remark
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {result.teacherRemark}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Question Breakdown */}
        {result.questions && result.questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Question Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of your answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getQuestionTypeColor(question.type)}>
                          {question.type.replace('_', ' ')}
                        </Badge>
                        <Badge
                          className={
                            question.isCorrect
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {question.pointsAwarded}/{question.points}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {question.text}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Your Answer:
                        </p>
                        <p className="text-sm bg-blue-50 p-2 rounded">
                          {question.studentAnswer || 'No answer provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Correct Answer:
                        </p>
                        <p className="text-sm bg-green-50 p-2 rounded">
                          {question.correctAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Overall Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Percentage:</span>
                    <span className="font-semibold">
                      {result.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Grade:</span>
                    <Badge className={getGradeColor(result.grade)}>
                      {result.grade}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge
                      className={
                        result.passed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {result.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {result.percentage >= 90 && (
                    <p>• Excellent performance! Keep up the great work.</p>
                  )}
                  {result.percentage >= 80 && result.percentage < 90 && (
                    <p>
                      • Very good performance. Consider reviewing missed
                      concepts.
                    </p>
                  )}
                  {result.percentage >= 70 && result.percentage < 80 && (
                    <p>
                      • Good performance. Focus on areas that need improvement.
                    </p>
                  )}
                  {result.percentage >= 50 && result.percentage < 70 && (
                    <p>
                      • Fair performance. Review the material and practice more.
                    </p>
                  )}
                  {result.percentage < 50 && (
                    <p>
                      • Needs improvement. Consider seeking additional help.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentDashboardLayout>
  );
}
