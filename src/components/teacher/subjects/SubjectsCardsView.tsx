'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardList,
  FileText,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { SubjectActionMenu, SubjectWithDetails } from './SubjectActionMenu';
import { SubjectPerformanceChart } from './SubjectPerformanceChart';

interface SubjectsCardsViewProps {
  subjects: SubjectWithDetails[];
  selectedSubjects: string[];
  onSelectionChange: (subjectIds: string[]) => void;
  onAction: (action: string, subject: SubjectWithDetails) => void;
}

export function SubjectsCardsView({
  subjects,
  selectedSubjects,
  onSelectionChange,
  onAction,
}: SubjectsCardsViewProps) {
  const handleCheckboxChange = (subjectId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSubjects, subjectId]);
    } else {
      onSelectionChange(selectedSubjects.filter(id => id !== subjectId));
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 70) return 'bg-blue-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Attention';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return (
        <Badge variant="default" className="bg-green-600">
          Active
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Generate mock chart data for each subject
  const getChartData = (baseScore: number) => {
    return Array.from({ length: 6 }).map((_, i) => ({
      name: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'][i],
      value: Math.min(100, Math.max(0, baseScore + Math.random() * 10 - 5)),
    }));
  };

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No subjects found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map(subject => (
        <Card
          key={subject.id}
          className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
        >
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Checkbox
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={checked =>
                    handleCheckboxChange(subject.id, checked as boolean)
                  }
                  aria-label={`Select ${subject.name}`}
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-1">{subject.name}</CardTitle>
                  <p className="text-sm text-gray-600">Code: {subject.code}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(subject.status || 'ACTIVE')}
                <SubjectActionMenu subject={subject} onAction={onAction} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6 space-y-4">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {subject.totalClasses || 0}
                </div>
                <div className="text-xs text-blue-700 mt-1">Classes</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {subject.totalStudents || 0}
                </div>
                <div className="text-xs text-green-700 mt-1">Students</div>
              </div>
              <div
                className={`text-center p-3 rounded-lg ${getPerformanceBgColor(subject.averageScore || 0)}`}
              >
                <div
                  className={`text-2xl font-bold ${getPerformanceColor(subject.averageScore || 0)}`}
                >
                  {subject.averageScore || 0}%
                </div>
                <div
                  className={`text-xs mt-1 ${getPerformanceColor(subject.averageScore || 0)}`}
                >
                  Avg Score
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {subject.completionRate || 0}%
                </div>
                <div className="text-xs text-purple-700 mt-1">Completion</div>
              </div>
            </div>

            {/* Performance Trend */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                  Performance Trend
                </h4>
                <Badge
                  variant="outline"
                  className={getPerformanceColor(subject.averageScore || 0)}
                >
                  {getPerformanceLabel(subject.averageScore || 0)}
                </Badge>
              </div>
              <SubjectPerformanceChart
                data={getChartData(subject.averageScore || 75)}
                type="area"
                height={120}
                showGrid={false}
              />
            </div>

            {/* Classes Teaching */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                Classes ({subject.classes?.length || 0})
              </h4>
              <div className="space-y-2">
                {subject.classes?.slice(0, 2).map((cls: any) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cls.name}
                        {cls.section}
                      </p>
                      <p className="text-xs text-gray-600">
                        {cls.studentCount} students
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-semibold ${getPerformanceColor(cls.averageScore || 0)}`}
                      >
                        {cls.averageScore || 0}%
                      </div>
                    </div>
                  </div>
                ))}
                {(subject.classes?.length || 0) > 2 && (
                  <button
                    onClick={() => onAction('view-analytics', subject)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    +{subject.classes.length - 2} more classes
                  </button>
                )}
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">
                Pending Tasks
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                  <Calendar className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-yellow-900">
                      {subject.upcomingLessons || 0} Lessons
                    </div>
                    <div className="text-xs text-yellow-700">This week</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded">
                  <ClipboardList className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-orange-900">
                      {subject.pendingAssignments || 0} Assignments
                    </div>
                    <div className="text-xs text-orange-700">To grade</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {subject.recentActivities &&
              subject.recentActivities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    Recent Activity
                  </h4>
                  <div className="space-y-1">
                    {subject.recentActivities
                      .slice(0, 2)
                      .map((activity: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center text-xs text-gray-600"
                        >
                          <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                          <span className="truncate">{activity.title}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('create-exam', subject)}
                className="flex-1 min-w-0"
              >
                <Trophy className="h-3 w-3 mr-1" />
                <span className="text-xs">Exam</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('create-assignment', subject)}
                className="flex-1 min-w-0"
              >
                <ClipboardList className="h-3 w-3 mr-1" />
                <span className="text-xs">Assignment</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('create-lesson-plan', subject)}
                className="flex-1 min-w-0"
              >
                <FileText className="h-3 w-3 mr-1" />
                <span className="text-xs">Lesson</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
