'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Card, CardContent } from '../../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Checkbox } from '../../ui/checkbox';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  GraduationCap,
  Clock,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';
import { Teacher } from '@/types/models';

interface TeachersTableProps {
  teachers: Teacher[];
  loading: boolean;
  onTeacherClick: (teacher: Teacher) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onTeacherUpdate: (teacher: Teacher) => void;
  onTeacherDelete: (teacherId: string) => void;
}

type SortField = 'name' | 'employeeId' | 'status' | 'hireDate' | 'classCount';
type SortDirection = 'asc' | 'desc';

export function TeachersTable({
  teachers,
  loading,
  onTeacherClick,
  pagination,
  onPageChange,
  onTeacherUpdate,
  onTeacherDelete,
}: TeachersTableProps) {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ON_LEAVE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'ON_LEAVE':
        return 'On Leave';
      case 'SUSPENDED':
        return 'Suspended';
      case 'TERMINATED':
        return 'Retired';
      default:
        return status;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeachers(teachers.map(t => t.id));
    } else {
      setSelectedTeachers([]);
    }
  };

  const handleSelectTeacher = (teacherId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeachers(prev => [...prev, teacherId]);
    } else {
      setSelectedTeachers(prev => prev.filter(id => id !== teacherId));
    }
  };

  const handleStatusToggle = async (teacher: Teacher) => {
    const newStatus = teacher.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    // TODO: API call to update status
    const updatedTeacher = { ...teacher, status: newStatus as any };
    onTeacherUpdate(updatedTeacher);
  };

  const renderPagination = () => {
    const { page, totalPages, total } = pagination;
    const startItem = (page - 1) * pagination.limit + 1;
    const endItem = Math.min(page * pagination.limit, total);

    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{total}</span> teachers
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-1">
            <span className="text-sm">Page</span>
            <span className="text-sm font-medium">{page}</span>
            <span className="text-sm">of</span>
            <span className="text-sm font-medium">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Bulk Actions Bar */}
        {selectedTeachers.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedTeachers.length} teacher
                {selectedTeachers.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button size="sm" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Assign Classes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTeachers([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedTeachers.length === teachers.length &&
                      teachers.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all teachers"
                  />
                </TableHead>
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:bg-transparent p-0"
                  >
                    <span>Teacher</span>
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('employeeId')}
                    className="flex items-center space-x-1 hover:bg-transparent p-0"
                  >
                    <span>Employee ID</span>
                    {getSortIcon('employeeId')}
                  </Button>
                </TableHead>
                <TableHead>Subjects & Classes</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:bg-transparent p-0"
                  >
                    <span>Status</span>
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('hireDate')}
                    className="flex items-center space-x-1 hover:bg-transparent p-0"
                  >
                    <span>Hire Date</span>
                    {getSortIcon('hireDate')}
                  </Button>
                </TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map(teacher => (
                <TableRow
                  key={teacher.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={e => {
                    if (!(e.target as HTMLElement).closest('button, input')) {
                      onTeacherClick(teacher);
                    }
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTeachers.includes(teacher.id)}
                      onCheckedChange={checked =>
                        handleSelectTeacher(teacher.id, checked as boolean)
                      }
                      onClick={e => e.stopPropagation()}
                      aria-label={`Select ${teacher.user?.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={undefined}
                        alt={teacher.user?.name || ''}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {teacher.user?.name
                          ?.split(' ')
                          .map(n => n[0])
                          .join('')
                          .substring(0, 2) || 'T'}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {teacher.user?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {teacher.user?.email}
                      </p>
                      {teacher.specialization && (
                        <p className="text-xs text-blue-600">
                          {teacher.specialization}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {teacher.employeeId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <GraduationCap className="h-4 w-4 mr-1 text-gray-400" />
                        <span>0 classes</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        No classes assigned
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('border', getStatusColor(teacher.status))}
                    >
                      {getStatusLabel(teacher.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="truncate max-w-[120px]">
                          {teacher.user?.email}
                        </span>
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {teacher.hireDate && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {format(new Date(teacher.hireDate), 'MMM yyyy')}
                          </span>
                        </div>
                      )}
                      {teacher.experience && (
                        <p className="text-xs text-gray-500 mt-1">
                          {teacher.experience} years exp.
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onTeacherClick(teacher)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusToggle(teacher)}
                        >
                          {teacher.status === 'ACTIVE' ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTeacherId(teacher.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Teacher
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {teachers.map(teacher => (
            <Card
              key={teacher.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTeacherClick(teacher)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={undefined}
                      alt={teacher.user?.name || ''}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {teacher.user?.name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2) || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 truncate">
                          {teacher.user?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {teacher.employeeId}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'border text-xs',
                          getStatusColor(teacher.status)
                        )}
                      >
                        {getStatusLabel(teacher.status)}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="truncate">{teacher.user?.email}</span>
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        <span>0 classes</span>
                      </div>
                    </div>

                    {teacher.specialization && (
                      <p className="text-sm text-blue-600 mt-2">
                        {teacher.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {teachers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No teachers found
            </h3>
            <p className="text-gray-500 mb-4">
              No teachers match your current filters. Try adjusting your search
              criteria.
            </p>
          </div>
        )}

        {/* Pagination */}
        {teachers.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            {renderPagination()}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteTeacherId}
          onOpenChange={() => setDeleteTeacherId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this teacher? This action cannot
                be undone. All associated data including class assignments will
                be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteTeacherId) {
                    onTeacherDelete(deleteTeacherId);
                    setDeleteTeacherId(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Teacher
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
