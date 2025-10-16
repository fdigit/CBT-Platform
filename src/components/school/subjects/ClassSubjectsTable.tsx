'use client';

import { MoreHorizontal, School, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Input } from '../../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';

interface ClassSubjectAssignment {
  id: string;
  class: {
    id: string;
    name: string;
    section?: string;
    academicYear: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
  };
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface ClassSubjectsTableProps {
  assignments: ClassSubjectAssignment[];
  loading: boolean;
  onRefresh: () => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

export function ClassSubjectsTable({
  assignments,
  loading,
  onRefresh,
  pagination,
  onPageChange,
}: ClassSubjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredAssignments = assignments.filter(
    assignment =>
      assignment.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.class.section
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.teacher.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.subject.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveAssignment = async (assignment: ClassSubjectAssignment) => {
    const className = `${assignment.class.name}${assignment.class.section ? ` ${assignment.class.section}` : ''}`;
    if (
      !confirm(
        `Remove ${assignment.teacher.name} from teaching ${assignment.subject.name} in ${className}?`
      )
    ) {
      return;
    }

    setRemovingId(assignment.id);

    try {
      const response = await fetch('/api/school/subjects/assign-classes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: assignment.class.id,
          teacherId: assignment.teacher.id,
          subjectId: assignment.subject.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove assignment');
      }

      toast({
        title: 'Success',
        description: 'Class assignment removed successfully',
      });

      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to remove assignment',
        variant: 'destructive',
      });
    } finally {
      setRemovingId(null);
    }
  };

  // Group assignments by class
  const groupedAssignments = filteredAssignments.reduce(
    (acc, assignment) => {
      const classKey = `${assignment.class.id}-${assignment.class.name}-${assignment.class.section || ''}`;
      if (!acc[classKey]) {
        acc[classKey] = {
          class: assignment.class,
          assignments: [],
        };
      }
      acc[classKey].assignments.push(assignment);
      return acc;
    },
    {} as Record<string, { class: any; assignments: ClassSubjectAssignment[] }>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <School className="h-5 w-5 text-purple-600" />
              Class ↔ Teacher ↔ Subject Assignments
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {pagination
                ? `${pagination.totalCount} total • page ${pagination.page} of ${pagination.totalPages}`
                : `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} total`}
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {Object.keys(groupedAssignments).length === 0 ? (
        <div className="text-center py-8">
          <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchTerm
              ? 'No assignments found matching your search'
              : 'No class assignments yet'}
          </p>
          {!searchTerm && (
            <p className="text-gray-400 text-sm">
              Assign teachers and subjects to classes to get started
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedAssignments).map(
            ({ class: classItem, assignments: classAssignments }) => (
              <div
                key={`${classItem.id}-${classItem.section}`}
                className="border rounded-lg p-4"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {classItem.name}
                      {classItem.section && ` - Section ${classItem.section}`}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {classItem.academicYear}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {classAssignments.length} assignment
                      {classAssignments.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Subject Code</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classAssignments.map(assignment => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {assignment.teacher.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {assignment.teacher.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {assignment.subject.name}
                          </TableCell>
                          <TableCell>
                            {assignment.subject.code ? (
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {assignment.subject.code}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {assignment.teacher.employeeId}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(
                              assignment.createdAt
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={removingId === assignment.id}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRemoveAssignment(assignment)
                                  }
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Assignment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalCount
                )}{' '}
                of {pagination.totalCount}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPageChange && onPageChange(pagination.page - 1)
                  }
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPageChange && onPageChange(pagination.page + 1)
                  }
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
