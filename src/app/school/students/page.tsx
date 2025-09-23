'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SchoolDashboardLayout } from '../../../components/school/SchoolDashboardLayout';
import { StudentsHeader } from '../../../components/school/students/StudentsHeader';
import { StudentsFilters } from '../../../components/school/students/StudentsFilters';
import { StudentsTable } from '../../../components/school/students/StudentsTable';
import { StudentsAnalytics } from '../../../components/school/students/StudentsAnalytics';
import { StudentProfileDrawer } from '../../../components/school/students/StudentProfileDrawer';
import { AddStudentModal } from '../../../components/school/students/AddStudentModal';
import { BulkUploadModal } from '../../../components/school/students/BulkUploadModal';
import { useToast } from '../../../hooks/use-toast';

export interface Student {
  id: string;
  regNumber: string;
  name: string;
  email: string;
  gender?: 'MALE' | 'FEMALE';
  class?: string;
  section?: string;
  parentPhone?: string;
  parentEmail?: string;
  dateOfBirth?: string;
  address?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'ALUMNI' | 'PENDING';
  avatar?: string;
  lastLogin?: string;
  lastExamTaken?: string;
  performanceScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentsFilters {
  search: string;
  class: string;
  section: string;
  gender: string;
  status: string;
  academicYear: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  tags: string[];
}

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [filters, setFilters] = useState<StudentsFilters>({
    search: '',
    class: '',
    section: '',
    gender: '',
    status: '',
    academicYear: '',
    dateRange: {},
    tags: [],
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchStudents();
  }, [session, status, router, filters, pagination.page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        class: filters.class,
        section: filters.section,
        gender: filters.gender,
        status: filters.status,
        academicYear: filters.academicYear,
        dateFrom: filters.dateRange.from?.toISOString() || '',
        dateTo: filters.dateRange.to?.toISOString() || '',
        tags: filters.tags.join(','),
      });

      const response = await fetch(`/api/school/students?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: Failed to fetch students`
        );
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch students';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileDrawerOpen(true);
  };

  const handleStudentUpdate = (updatedStudent: Student) => {
    setStudents(prev =>
      prev.map(s => (s.id === updatedStudent.id ? updatedStudent : s))
    );
    setSelectedStudent(updatedStudent);
  };

  const handleStudentAdd = (newStudent: Student) => {
    setStudents(prev => [newStudent, ...prev]);
    fetchStudents(); // Refresh to get updated pagination
  };

  const handleBulkStudentsAdd = (newStudents: Student[]) => {
    fetchStudents(); // Refresh entire list after bulk import
  };

  const handleFiltersChange = (newFilters: Partial<StudentsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSelectionChange = (studentIds: string[]) => {
    setSelectedStudents(studentIds);
  };

  const handleBulkAction = async (action: string, studentIds: string[]) => {
    try {
      const response = await fetch('/api/school/students/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, studentIds }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Bulk action "${action}" completed successfully`,
        });
        fetchStudents();
        setSelectedStudents([]);
      } else {
        throw new Error('Bulk action failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <SchoolDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        </div>
      </SchoolDashboardLayout>
    );
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Analytics Widgets */}
        <StudentsAnalytics students={students} />

        {/* Header with Action Buttons */}
        <StudentsHeader
          onAddStudent={() => setIsAddModalOpen(true)}
          onBulkUpload={() => setIsBulkUploadOpen(true)}
          onExport={() => {
            /* TODO: Implement export */
          }}
          selectedCount={selectedStudents.length}
          onBulkAction={handleBulkAction}
          selectedStudents={selectedStudents}
        />

        {/* Search & Filter Panel */}
        <StudentsFilters filters={filters} onChange={handleFiltersChange} />

        {/* Students Table */}
        <StudentsTable
          students={students}
          loading={loading}
          selectedStudents={selectedStudents}
          onSelectionChange={handleSelectionChange}
          onStudentClick={handleStudentClick}
          pagination={pagination}
          onPageChange={page => setPagination(prev => ({ ...prev, page }))}
          onStudentUpdate={handleStudentUpdate}
        />

        {/* Modals and Drawers */}
        <AddStudentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onStudentAdded={handleStudentAdd}
        />

        <BulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          onStudentsAdded={handleBulkStudentsAdd}
        />

        <StudentProfileDrawer
          student={selectedStudent}
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          onStudentUpdate={handleStudentUpdate}
        />
      </div>
    </SchoolDashboardLayout>
  );
}
