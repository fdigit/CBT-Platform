'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  TrendingUp,
  School,
  BookOpen,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface ExamAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  summary: {
    totalExams: number;
    activeExams: number;
    scheduledExams: number;
    closedExams: number;
    pendingApprovals: number;
  };
  topSchools: Array<{
    schoolId: string;
    schoolName: string;
    examCount: number;
  }>;
  questionTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
  upcomingExams: Array<{
    id: string;
    title: string;
    schoolName: string;
    startTime: string;
    questionsCount: number;
    registeredStudents: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
}

export function ExamAnalytics({ className }: ExamAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/exams/analytics');
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Schools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Top Schools by Exam Count
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topSchools.slice(0, 5).map((school, index) => (
              <div
                key={school.schoolId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {school.schoolName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {school.examCount} exams created
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {school.examCount}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Question Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.questionTypeDistribution.map(type => (
              <div
                key={type.type}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl font-bold text-gray-900">
                  {type.count}
                </div>
                <div className="text-sm text-gray-600">
                  {type.type} Questions
                </div>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className={
                      type.type === 'MCQ'
                        ? 'bg-blue-50 text-blue-700'
                        : type.type === 'ESSAY'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-green-50 text-green-700'
                    }
                  >
                    {type.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Exams (Next 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.upcomingExams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No upcoming exams in the next 7 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.upcomingExams.map(exam => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {exam.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {exam.schoolName} •{' '}
                      {format(new Date(exam.startTime), 'MMM dd, yyyy HH:mm')}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {exam.questionsCount} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {exam.registeredStudents} students
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      Upcoming
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(`/admin/exams/${exam.id}`, '_blank')
                      }
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Exam Creation Trend (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.monthlyTrend.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No data available for trend analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.monthlyTrend.slice(-6).map(item => (
                <div key={item.month} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-600">
                    {format(new Date(item.month + '-01'), 'MMM yyyy')}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max(5, (item.count / Math.max(...analytics.monthlyTrend.map(m => m.count))) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="w-12 text-sm font-medium text-gray-900">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            AI Insights (Coming Soon)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">
                    Placeholder for AI Analysis
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Future AI features will include:
                  </div>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Auto-detection of duplicate exam content</li>
                    <li>• Identification of suspicious exam patterns</li>
                    <li>• Performance anomaly detection</li>
                    <li>• Content quality recommendations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
