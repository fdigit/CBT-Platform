'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SchoolDashboardLayout } from '../../../components/school/SchoolDashboardLayout';
import { useToast } from '../../../hooks/use-toast';
import { TeachersAnalytics } from '../../../components/school/teachers/TeachersAnalytics';
import { TeachersHeader } from '../../../components/school/teachers/TeachersHeader';
import { TeachersFilters } from '../../../components/school/teachers/TeachersFilters';
import { TeachersTable } from '../../../components/school/teachers/TeachersTable';
import { AddTeacherModal } from '../../../components/school/teachers/AddTeacherModal';
import { TeacherProfileDrawer } from '../../../components/school/teachers/TeacherProfileDrawer';
import { BulkUploadModal } from '../../../components/school/teachers/BulkUploadModal';

import { Teacher } from '@/types/models';

export interface TeachersFilters {
  search: string;
  academicYear: string;
  subjects: string;
  classes: string;
  role: string;
  status: string;
  hireDateFrom: string;
  hireDateTo: string;
  gender: string;
}

export interface TeachersStats {
  total: number;
  active: number;
  onLeave: number;
  suspended: number;
  retired: number;
  bySubject: Record<string, number>;
  byRole: Record<string, number>;
  workloadDistribution: Array<{
    teacherId: string;
    teacherName: string;
    classCount: number;
    studentCount: number;
    workloadScore: number;
  }>;
  performanceAlerts: Array<{
    teacherId: string;
    teacherName: string;
    alertType: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export default function TeachersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<TeachersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<TeachersFilters>({
    search: '',
    academicYear: '',
    subjects: '',
    classes: '',
    role: '',
    status: '',
    hireDateFrom: '',
    hireDateTo: '',
    gender: '',
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

    fetchTeachers();
    fetchStats();
  }, [session, status, router, filters, pagination.page]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        ),
      });

      const response = await fetch(`/api/school/teachers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      } else {
        throw new Error('Failed to fetch teachers');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch teachers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/school/teachers/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch teacher stats:', error);
    }
  };

  const handleFiltersChange = (newFilters: Partial<TeachersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsProfileDrawerOpen(true);
  };

  const handleTeacherAdd = (newTeacher: Teacher) => {
    setTeachers(prev => [newTeacher, ...prev]);
    setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    fetchStats(); // Refresh stats
    toast({
      title: 'Success',
      description: 'Teacher added successfully',
    });
  };

  const handleTeacherUpdate = (updatedTeacher: Teacher) => {
    setTeachers(prev =>
      prev.map(t => (t.id === updatedTeacher.id ? updatedTeacher : t))
    );
    if (selectedTeacher?.id === updatedTeacher.id) {
      setSelectedTeacher(updatedTeacher);
    }
    fetchStats(); // Refresh stats
    toast({
      title: 'Success',
      description: 'Teacher updated successfully',
    });
  };

  const handleTeacherDelete = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/school/teachers/${teacherId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTeachers(prev => prev.filter(t => t.id !== teacherId));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        fetchStats(); // Refresh stats
        toast({
          title: 'Success',
          description: 'Teacher deleted successfully',
        });
      } else {
        throw new Error('Failed to delete teacher');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete teacher',
        variant: 'destructive',
      });
    }
  };

  const handleBulkUpload = (uploadedTeachers: Teacher[]) => {
    setTeachers(prev => [...uploadedTeachers, ...prev]);
    setPagination(prev => ({
      ...prev,
      total: prev.total + uploadedTeachers.length,
    }));
    fetchStats(); // Refresh stats
    toast({
      title: 'Success',
      description: `${uploadedTeachers.length} teachers uploaded successfully`,
    });
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch(
        `/api/school/teachers/export?format=${format}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teachers.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: `Teachers exported as ${format.toUpperCase()}`,
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export teachers',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading') {
    return (
      <SchoolDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </SchoolDashboardLayout>
    );
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Analytics Widgets */}
        {stats && <TeachersAnalytics stats={stats} />}

        {/* Header with Action Buttons */}
        <TeachersHeader
          onAddTeacher={() => setIsAddModalOpen(true)}
          onBulkUpload={() => setIsBulkUploadOpen(true)}
          onExport={handleExport}
          teachersCount={pagination.total}
        />

        {/* Search & Filter Panel */}
        <TeachersFilters filters={filters} onChange={handleFiltersChange} />

        {/* Teachers Table */}
        <TeachersTable
          teachers={teachers}
          loading={loading}
          onTeacherClick={handleTeacherClick}
          pagination={pagination}
          onPageChange={page => setPagination(prev => ({ ...prev, page }))}
          onTeacherUpdate={handleTeacherUpdate}
          onTeacherDelete={handleTeacherDelete}
        />

        {/* Modals and Drawers */}
        <AddTeacherModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onTeacherAdded={handleTeacherAdd}
        />

        <BulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          onTeachersUploaded={handleBulkUpload}
        />

        <TeacherProfileDrawer
          teacher={selectedTeacher}
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          onTeacherUpdate={handleTeacherUpdate}
        />
      </div>
    </SchoolDashboardLayout>
  );
}
