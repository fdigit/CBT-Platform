'use client';

import { Student } from '@/types/models';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  GraduationCap,
  Mail,
  MoreHorizontal,
  Phone,
  Trash2,
  User,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';

// Extended student type with API response fields
interface StudentWithDetails extends Student {
  name?: string;
  email?: string;
  className?: string;
  class?: string;
  classSection?: string;
  gender?: string;
  parentPhone?: string;
  parentEmail?: string;
  status?: string;
  performanceScore?: number;
}

interface StudentsTableProps {
  students: StudentWithDetails[];
  loading: boolean;
  selectedStudents: string[];
  onSelectionChange: (studentIds: string[]) => void;
  onStudentClick: (student: Student) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onStudentUpdate: (student: Student) => void;
}

interface SortConfig {
  key: keyof StudentWithDetails | null;
  direction: 'asc' | 'desc';
}

export function StudentsTable({
  students,
  loading,
  selectedStudents,
  onSelectionChange,
  onStudentClick,
  pagination,
  onPageChange,
  onStudentUpdate,
}: StudentsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });
  const [deleteStudent, setDeleteStudent] = useState<StudentWithDetails | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSort = (key: keyof StudentWithDetails) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(students.map(s => s.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedStudents, studentId]);
    } else {
      onSelectionChange(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleStudentAction = async (
    action: string,
    student: StudentWithDetails
  ) => {
    try {
      const response = await fetch(`/api/school/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.toUpperCase() }),
      });

      if (response.ok) {
        const updatedStudent = await response.json();
        onStudentUpdate(updatedStudent);
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/school/students/${deleteStudent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        onSelectionChange(
          selectedStudents.filter(id => id !== deleteStudent.id)
        );
        // The parent component should refetch the data
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    } finally {
      setIsDeleting(false);
      setDeleteStudent(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800' },
      SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-800' },
      GRADUATED: { label: 'Graduated', className: 'bg-blue-100 text-blue-800' },
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      ALUMNI: { label: 'Alumni', className: 'bg-purple-100 text-purple-800' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPerformanceColor = (score?: number) => {
    if (!score && score !== 0) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isAllSelected =
    students.length > 0 && selectedStudents.length === students.length;
  const isPartiallySelected =
    selectedStudents.length > 0 && selectedStudents.length < students.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      {...(isPartiallySelected ? { indeterminate: true } : {})}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('regNumber')}
                      className="h-auto p-0 font-semibold"
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('regNumber')}
                      className="h-auto p-0 font-semibold"
                    >
                      Admission No.
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Class/Section</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Parent/Guardian</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-16">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Students Found
                          </h3>
                          <p className="text-gray-500 max-w-md">
                            {/* Check if any filters are applied */}
                            Get started by adding your first student or try
                            adjusting your search filters.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map(student => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onStudentClick(student)}
                    >
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={checked =>
                            handleSelectStudent(student.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={undefined} />
                          <AvatarFallback>
                            {getInitials(
                              student.name || student.user?.name || ''
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student.name || student.user?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email || student.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {student.regNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student.className ||
                              student.class ||
                              'Not assigned'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.classSection
                              ? `Section ${student.classSection}`
                              : 'No section'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.gender || 'Not specified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {student.parentPhone || 'Not specified'}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {student.parentEmail || 'Not specified'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status || 'ACTIVE')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={getPerformanceColor(
                            student.performanceScore
                          )}
                        >
                          {student.performanceScore
                            ? `${student.performanceScore}%`
                            : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onStudentClick(student)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onStudentClick(student)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Student
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStudentAction('active', student)
                              }
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStudentAction('suspended', student)
                              }
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStudentAction('graduated', student)
                              }
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Graduate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteStudent(student)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4">
            {students.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Students Found
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      Get started by adding your first student or try adjusting
                      your search filters.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              students.map(student => (
                <Card
                  key={student.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onStudentClick(student)}
                >
                  <div className="flex items-start space-x-3">
                    <div onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={checked =>
                          handleSelectStudent(student.id, checked as boolean)
                        }
                      />
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={undefined} />
                      <AvatarFallback>
                        {getInitials(student.name || student.user?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {student.name || student.user?.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {student.regNumber}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(student.status || 'ACTIVE')}
                          <div onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => onStudentClick(student)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteStudent(student)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          {student.className || student.class || 'Not assigned'}
                        </span>
                        <span>
                          {student.classSection
                            ? `Section ${student.classSection}`
                            : 'No section'}
                        </span>
                        <span>{student.gender || 'Not specified'}</span>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`text-sm font-medium ${getPerformanceColor(student.performanceScore)}`}
                        >
                          Performance:{' '}
                          {student.performanceScore
                            ? `${student.performanceScore}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} students
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={
                            page === pagination.page ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => onPageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteStudent}
        onOpenChange={() => setDeleteStudent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteStudent?.user?.name}? This
              action cannot be undone and will also delete all their exam
              records and results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Student'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
