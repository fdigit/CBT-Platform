'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { SubjectActionMenu, SubjectWithDetails } from './SubjectActionMenu';

interface SubjectsTableViewProps {
  subjects: SubjectWithDetails[];
  selectedSubjects: string[];
  onSelectionChange: (subjectIds: string[]) => void;
  onAction: (action: string, subject: SubjectWithDetails) => void;
}

interface SortConfig {
  key: keyof SubjectWithDetails | null;
  direction: 'asc' | 'desc';
}

export function SubjectsTableView({
  subjects,
  selectedSubjects,
  onSelectionChange,
  onAction,
}: SubjectsTableViewProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (key: keyof SubjectWithDetails) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSubjects = [...subjects].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === undefined || bValue === undefined) return 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(subjects.map(s => s.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleCheckboxChange = (subjectId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSubjects, subjectId]);
    } else {
      onSelectionChange(selectedSubjects.filter(id => id !== subjectId));
    }
  };

  const toggleRowExpansion = (subjectId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No subjects found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedSubjects.length === subjects.length &&
                      subjects.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all subjects"
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-8 px-2 lg:px-3"
                  >
                    Subject
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('code')}
                    className="h-8 px-2 lg:px-3"
                  >
                    Code
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('totalClasses')}
                    className="h-8 px-2 lg:px-3"
                  >
                    Classes
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('totalStudents')}
                    className="h-8 px-2 lg:px-3"
                  >
                    Students
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('averageScore')}
                    className="h-8 px-2 lg:px-3"
                  >
                    Avg Score
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubjects.map(subject => (
                <>
                  <TableRow key={subject.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={checked =>
                          handleCheckboxChange(subject.id, checked as boolean)
                        }
                        aria-label={`Select ${subject.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(subject.id)}
                        className="h-6 w-6 p-0"
                      >
                        {expandedRows.has(subject.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {subject.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {subject.code}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {subject.totalClasses || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700"
                      >
                        {subject.totalStudents || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={getPerformanceColor(
                          subject.averageScore || 0
                        )}
                      >
                        {subject.averageScore || 0}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subject.status || 'ACTIVE')}
                    </TableCell>
                    <TableCell>
                      <SubjectActionMenu
                        subject={subject}
                        onAction={onAction}
                      />
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row Details */}
                  {expandedRows.has(subject.id) && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-gray-50 p-4">
                        <div className="space-y-4">
                          {/* Classes Details */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Classes Teaching ({subject.classes?.length || 0})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {subject.classes?.map((cls: any) => (
                                <div
                                  key={cls.id}
                                  className="flex items-center justify-between p-2 bg-white rounded border"
                                >
                                  <div>
                                    <p className="text-sm font-medium">
                                      {cls.name}
                                      {cls.section}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {cls.studentCount} students
                                    </p>
                                  </div>
                                  <Badge
                                    className={getPerformanceColor(
                                      cls.averageScore || 0
                                    )}
                                  >
                                    {cls.averageScore || 0}%
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Performance Summary */}
                          <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded border">
                              <div className="text-xs text-gray-600">
                                Performance
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {getPerformanceLabel(subject.averageScore || 0)}
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-xs text-gray-600">
                                Completion Rate
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {subject.completionRate || 0}%
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-xs text-gray-600">
                                Upcoming Lessons
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {subject.upcomingLessons || 0}
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-xs text-gray-600">
                                Pending Assignments
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {subject.pendingAssignments || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
