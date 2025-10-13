'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Award,
  BookOpen,
  Calendar,
  Download,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { SubjectWithDetails } from './SubjectActionMenu';
import { SubjectPerformanceChart } from './SubjectPerformanceChart';

interface SubjectAnalyticsTabProps {
  subjects: SubjectWithDetails[];
}

export function SubjectAnalyticsTab({ subjects }: SubjectAnalyticsTabProps) {
  // Calculate overall statistics
  const totalSubjects = subjects.length;
  const totalStudents = subjects.reduce(
    (sum, s) => sum + (s.totalStudents || 0),
    0
  );
  const averagePerformance =
    subjects.length > 0
      ? Math.round(
          subjects.reduce((sum, s) => sum + (s.averageScore || 0), 0) /
            subjects.length
        )
      : 0;
  const averageCompletion =
    subjects.length > 0
      ? Math.round(
          subjects.reduce((sum, s) => sum + (s.completionRate || 0), 0) /
            subjects.length
        )
      : 0;

  // Prepare chart data
  const performanceComparisonData = subjects.slice(0, 6).map(s => ({
    name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
    value: s.averageScore || 0,
  }));

  const engagementTrendData = Array.from({ length: 6 }).map((_, i) => ({
    name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
    value: Math.floor(Math.random() * 30) + 70,
  }));

  const scoreDistributionData = [
    {
      name: 'Excellent (≥80%)',
      value: subjects.filter(s => (s.averageScore || 0) >= 80).length,
    },
    {
      name: 'Good (70-79%)',
      value: subjects.filter(
        s => (s.averageScore || 0) >= 70 && (s.averageScore || 0) < 80
      ).length,
    },
    {
      name: 'Average (60-69%)',
      value: subjects.filter(
        s => (s.averageScore || 0) >= 60 && (s.averageScore || 0) < 70
      ).length,
    },
    {
      name: 'Needs Attention (<60%)',
      value: subjects.filter(s => (s.averageScore || 0) < 60).length,
    },
  ];

  // Top and bottom performing subjects
  const sortedByPerformance = [...subjects].sort(
    (a, b) => (b.averageScore || 0) - (a.averageScore || 0)
  );
  const topPerformers = sortedByPerformance.slice(0, 5);
  const bottomPerformers = sortedByPerformance.slice(-5).reverse();

  const handleExport = (format: string) => {
    // Mock export functionality
    console.log(`Exporting analytics as ${format}`);
    alert(`Analytics export as ${format} will be available soon!`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Performance Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive insights across all your subjects
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-40">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">Export as PDF</SelectItem>
              <SelectItem value="csv">Export as CSV</SelectItem>
              <SelectItem value="excel">Export as Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {totalSubjects}
                </div>
                <p className="text-xs text-gray-600">Active subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {totalStudents}
                </div>
                <p className="text-xs text-gray-600">Across all subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {averagePerformance}%
                </div>
                <p className="text-xs text-gray-600">Overall score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {averageCompletion}%
                </div>
                <p className="text-xs text-gray-600">Assignment completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Subject Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectPerformanceChart
              data={performanceComparisonData}
              type="bar"
              height={300}
              showGrid={true}
              color="#2563eb"
            />
          </CardContent>
        </Card>

        {/* Student Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Student Engagement Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectPerformanceChart
              data={engagementTrendData}
              type="line"
              height={300}
              showGrid={true}
              color="#16a34a"
            />
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-purple-600" />
            Performance Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scoreDistributionData.map((item, index) => {
              const total = scoreDistributionData.reduce(
                (sum, d) => sum + d.value,
                0
              );
              const percentage =
                total > 0 ? Math.round((item.value / total) * 100) : 0;
              const colors = [
                'bg-green-500',
                'bg-blue-500',
                'bg-yellow-500',
                'bg-red-500',
              ];

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.value} subjects ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[index]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top and Bottom Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Performing Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((subject, index) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-green-600 text-white">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-900">
                        {subject.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {subject.totalStudents} students
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {subject.averageScore}%
                    </div>
                    <div className="text-xs text-green-700">Avg Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <TrendingDown className="h-5 w-5 mr-2" />
              Subjects Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottomPerformers.length > 0 ? (
                bottomPerformers.map((subject, index) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-orange-600 text-white">
                        #{sortedByPerformance.length - index}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900">
                          {subject.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {subject.totalStudents} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">
                        {subject.averageScore}%
                      </div>
                      <div className="text-xs text-orange-700">Avg Score</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-4">
                  All subjects are performing well!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
