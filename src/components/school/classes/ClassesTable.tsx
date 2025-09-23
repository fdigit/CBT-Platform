'use client';

import { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
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
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  MapPin,
} from 'lucide-react';
// Define types locally instead of importing from page
interface Class {
  id: string;
  name: string;
  section?: string;
  academicYear: string;
  description?: string;
  maxStudents: number;
  room?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  studentCount: number;
  examCount: number;
  teachers: Array<{
    id: string;
    name: string;
    email: string;
    employeeId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ClassesTableProps {
  classes: Class[];
  loading: boolean;
  onClassClick: (classItem: Class) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onClassUpdate: (classItem: Class) => void;
  onClassDelete: (classId: string) => void;
}

export function ClassesTable({
  classes,
  loading,
  onClassClick,
  pagination,
  onPageChange,
  onClassUpdate,
  onClassDelete,
}: ClassesTableProps) {
  const [deleteClass, setDeleteClass] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClass = async () => {
    if (!deleteClass) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/school/classes/${deleteClass.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onClassDelete(deleteClass.id);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete class');
      }
    } catch (error) {
      alert('Failed to delete class');
    } finally {
      setIsDeleting(false);
      setDeleteClass(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800' },
      INACTIVE: {
        label: 'Inactive',
        className: 'bg-yellow-100 text-yellow-800',
      },
      ARCHIVED: { label: 'Archived', className: 'bg-gray-100 text-gray-800' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading classes...</p>
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
                  <TableHead>Class</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-gray-500"
                    >
                      No classes found. Create your first class to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map(classItem => (
                    <TableRow
                      key={classItem.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onClassClick(classItem)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {classItem.name}
                            {classItem.section && ` - ${classItem.section}`}
                          </div>
                          {classItem.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {classItem.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {classItem.academicYear}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>
                            {classItem.studentCount}/{classItem.maxStudents}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <GraduationCap className="h-4 w-4 text-green-600" />
                          <span>{classItem.teachers.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {classItem.room ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{classItem.room}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(classItem.status)}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onClassClick(classItem)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onClassClick(classItem)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Class
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteClass(classItem)}
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
            {classes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No classes found. Create your first class to get started.
              </div>
            ) : (
              classes.map(classItem => (
                <Card
                  key={classItem.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onClassClick(classItem)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {classItem.name}
                          {classItem.section && ` - ${classItem.section}`}
                        </h3>
                        {getStatusBadge(classItem.status)}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Academic Year: {classItem.academicYear}</div>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {classItem.studentCount}/{classItem.maxStudents}
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <GraduationCap className="h-4 w-4" />
                            <span>{classItem.teachers.length}</span>
                          </span>
                        </div>
                        {classItem.room && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{classItem.room}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onClassClick(classItem)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteClass(classItem)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                of {pagination.total} classes
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
        open={!!deleteClass}
        onOpenChange={() => setDeleteClass(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteClass?.name}
              {deleteClass?.section && ` - ${deleteClass.section}`}? This action
              cannot be undone if the class has no students or exams.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClass}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Class'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
