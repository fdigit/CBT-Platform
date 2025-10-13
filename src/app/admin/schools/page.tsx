'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';
import { Pagination } from '../../../components/dashboard/Pagination';
import {
    SchoolFilters,
    type SchoolFilters as SchoolFiltersType,
} from '../../../components/dashboard/SchoolFilters';
import { SchoolManagementTable } from '../../../components/dashboard/SchoolManagementTable';
import { SchoolsSummary } from '../../../components/dashboard/SchoolsSummary';
import { useToast } from '../../../hooks/use-toast';

interface School {
  id: string;
  name: string;
  email: string;
  phone?: string;
  logoUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  admins: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count: {
    students: number;
    exams: number;
    users: number;
  };
}

interface SchoolsResponse {
  schools: School[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    pending: number;
    approved: number;
    suspended: number;
    rejected: number;
  };
}

export default function SchoolsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schoolsData, setSchoolsData] = useState<SchoolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SchoolFiltersType>({
    search: '',
    status: 'all',
    dateRange: { from: null, to: null },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchSchools();
  }, [session, status, router, filters, pagination]);

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.status && filters.status !== 'all')
      params.set('status', filters.status);
    if (filters.dateRange.from)
      params.set('dateFrom', filters.dateRange.from.toISOString());
    if (filters.dateRange.to)
      params.set('dateTo', filters.dateRange.to.toISOString());

    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());

    return params.toString();
  }, [filters, pagination]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/schools?${queryParams}`);

      if (response.ok) {
        const data: SchoolsResponse = await response.json();
        setSchoolsData(data);
      } else {
        throw new Error('Failed to fetch schools');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch schools',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: SchoolFiltersType) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setPagination({ page: 1, limit });
  };

  const handleSchoolUpdate = (schoolId: string, updates: Partial<School>) => {
    if (!schoolsData) return;

    const updatedSchools = schoolsData.schools.map(school =>
      school.id === schoolId ? { ...school, ...updates } : school
    );

    setSchoolsData({
      ...schoolsData,
      schools: updatedSchools,
    });
  };

  const handleSchoolDelete = (schoolId: string) => {
    if (!schoolsData) return;

    const updatedSchools = schoolsData.schools.filter(
      school => school.id !== schoolId
    );

    setSchoolsData({
      ...schoolsData,
      schools: updatedSchools,
      pagination: {
        ...schoolsData.pagination,
        total: schoolsData.pagination.total - 1,
      },
    });
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const queryParams = buildQueryParams();
      const response = await fetch(
        `/api/schools/export?format=${format}&${queryParams}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schools-export.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Success',
          description: `Schools exported as ${format.toUpperCase()}`,
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to export as ${format.toUpperCase()}`,
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Schools Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage and approve school registrations on the platform
          </p>
        </div>

        {/* Summary Cards */}
        <SchoolsSummary
          summary={
            schoolsData?.summary || {
              total: 0,
              pending: 0,
              approved: 0,
              suspended: 0,
              rejected: 0,
            }
          }
          loading={loading}
        />

        {/* Filters */}
        <SchoolFilters
          onFiltersChange={handleFiltersChange}
          onExport={handleExport}
          onRefresh={fetchSchools}
          loading={loading}
        />

        {/* Schools Table */}
        {schoolsData && (
          <>
            <SchoolManagementTable
              schools={schoolsData.schools}
              onSchoolUpdate={handleSchoolUpdate}
              onSchoolDelete={handleSchoolDelete}
            />

            {/* Pagination */}
            <Pagination
              currentPage={schoolsData.pagination.page}
              totalPages={schoolsData.pagination.totalPages}
              pageSize={schoolsData.pagination.limit}
              totalItems={schoolsData.pagination.total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && schoolsData && schoolsData.schools.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No schools found</div>
            <p className="text-gray-400 mt-1">
              {filters.search || filters.status !== 'all'
                ? 'Try adjusting your filters'
                : 'No schools have been registered yet'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
