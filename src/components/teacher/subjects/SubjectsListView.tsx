'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Eye, FileText, Users } from 'lucide-react';
import { SubjectActionMenu, SubjectWithDetails } from './SubjectActionMenu';

interface SubjectsListViewProps {
  subjects: SubjectWithDetails[];
  selectedSubjects: string[];
  onSelectionChange: (subjectIds: string[]) => void;
  onAction: (action: string, subject: SubjectWithDetails) => void;
}

export function SubjectsListView({
  subjects,
  selectedSubjects,
  onSelectionChange,
  onAction,
}: SubjectsListViewProps) {
  const handleCheckboxChange = (subjectId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSubjects, subjectId]);
    } else {
      onSelectionChange(selectedSubjects.filter(id => id !== subjectId));
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return (
        <Badge variant="default" className="bg-green-600 text-xs">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        {status}
      </Badge>
    );
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
    <div className="space-y-3">
      {subjects.map(subject => (
        <Card key={subject.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left Section: Checkbox and Info */}
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <Checkbox
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={checked =>
                    handleCheckboxChange(subject.id, checked as boolean)
                  }
                  aria-label={`Select ${subject.name}`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {subject.name}
                    </h3>
                    {getStatusBadge(subject.status || 'ACTIVE')}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {subject.code}
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {subject.totalClasses || 0} classes
                    </span>
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {subject.totalStudents || 0} students
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section: Performance and Actions */}
              <div className="flex items-center space-x-3">
                {/* Performance Bar */}
                <div className="hidden sm:flex flex-col items-end min-w-[100px]">
                  <div className="text-xs text-gray-600 mb-1">Performance</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getPerformanceColor(subject.averageScore || 0)}`}
                      style={{ width: `${subject.averageScore || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-semibold text-gray-900 mt-1">
                    {subject.averageScore || 0}%
                  </div>
                </div>

                {/* Mobile Performance Badge */}
                <div className="sm:hidden">
                  <Badge className="bg-blue-50 text-blue-700">
                    {subject.averageScore || 0}%
                  </Badge>
                </div>

                {/* Quick View Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction('view-analytics', subject)}
                  className="hidden md:flex"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>

                {/* Action Menu */}
                <SubjectActionMenu subject={subject} onAction={onAction} />
              </div>
            </div>

            {/* Mobile-only expanded info */}
            <div className="mt-3 pt-3 border-t sm:hidden">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 rounded p-2">
                  <div className="text-lg font-bold text-blue-600">
                    {subject.totalClasses || 0}
                  </div>
                  <div className="text-xs text-blue-700">Classes</div>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="text-lg font-bold text-green-600">
                    {subject.totalStudents || 0}
                  </div>
                  <div className="text-xs text-green-700">Students</div>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <div className="text-lg font-bold text-purple-600">
                    {subject.completionRate || 0}%
                  </div>
                  <div className="text-xs text-purple-700">Complete</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
