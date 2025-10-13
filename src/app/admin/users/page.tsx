'use client';

import { Download, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  BulkActionModal,
  DeleteUserModal,
  EditUserModal,
  ResetPasswordModal,
  UserAnalytics,
  UserFilters,
  UserSummaryStats,
  UserTable,
} from '../../../components/admin';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../hooks/use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'STUDENT';
  school?: {
    id: string;
    name: string;
    status: string;
  } | null;
  regNumber?: string;
  createdAt: string;
  updatedAt: string;
  notificationCount: number;
}

export interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  roleDistribution: {
    SUPER_ADMIN: number;
    SCHOOL_ADMIN: number;
    STUDENT: number;
  };
}

export interface UserFiltersState {
  search: string;
  role: string;
  schoolId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [schools, setSchools] = useState<
    Array<{ id: string; name: string; status: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<UserFiltersState>({
    search: '',
    role: 'all',
    schoolId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([_, value]) => value !== '' && value !== 'all'
          )
        ),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  // Fetch schools data
  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/schools');
      if (!response.ok) throw new Error('Failed to fetch schools');

      const data = await response.json();
      setSchools(data.schools || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchUsers();
      fetchSchools();
    }
  }, [session, fetchUsers, fetchSchools]);

  // User actions
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    // For now, just show user details in a toast
    toast({
      title: 'User Details',
      description: `${user.name} (${user.email}) - ${user.role}`,
    });
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to suspend user');

      toast({
        title: 'Success',
        description: 'User suspended successfully',
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'destructive',
      });
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reactivate user');

      toast({
        title: 'Success',
        description: 'User reactivated successfully',
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reactivate user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      setDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.id}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword }),
        }
      );

      if (!response.ok) throw new Error('Failed to reset password');

      toast({
        title: 'Success',
        description: 'Password reset successfully',
      });
      setResetPasswordModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset password',
        variant: 'destructive',
      });
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      const url = selectedUser
        ? `/api/admin/users/${selectedUser.id}`
        : '/api/admin/users';

      const method = selectedUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok)
        throw new Error(`Failed to ${selectedUser ? 'update' : 'create'} user`);

      toast({
        title: 'Success',
        description: `User ${selectedUser ? 'updated' : 'created'} successfully`,
      });
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${selectedUser ? 'update' : 'create'} user`,
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    setBulkActionModalOpen(true);
  };

  const handleConfirmBulkAction = async (action: string, message?: string) => {
    try {
      // For now, process each user individually
      // In a real implementation, you'd have a bulk action endpoint
      for (const userId of selectedUsers) {
        switch (action) {
          case 'suspend':
            await fetch(`/api/admin/users/${userId}/suspend`, {
              method: 'POST',
            });
            break;
          case 'reactivate':
            await fetch(`/api/admin/users/${userId}/reactivate`, {
              method: 'POST',
            });
            break;
          case 'delete':
            await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            break;
          case 'reset-password':
            await fetch(`/api/admin/users/${userId}/reset-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newPassword: 'TempPassword123!' }),
            });
            break;
        }
      }

      toast({
        title: 'Success',
        description: `Bulk action completed for ${selectedUsers.length} users`,
      });
      setBulkActionModalOpen(false);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete bulk action',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const response = await fetch(`/api/admin/users/export?format=${format}`);

      if (!response.ok) throw new Error('Failed to export users');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Users exported successfully as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export users',
        variant: 'destructive',
      });
    }
  };

  // Generate mock analytics data
  const analyticsData = {
    roleDistribution: [
      {
        name: 'Students',
        value: stats?.roleDistribution.STUDENT || 0,
        color: '#0088FE',
      },
      {
        name: 'School Admins',
        value: stats?.roleDistribution.SCHOOL_ADMIN || 0,
        color: '#00C49F',
      },
      {
        name: 'Super Admins',
        value: stats?.roleDistribution.SUPER_ADMIN || 0,
        color: '#FFBB28',
      },
    ],
    monthlyGrowth: [
      { month: 'Jan', users: 100, newUsers: 10 },
      { month: 'Feb', users: 150, newUsers: 50 },
      { month: 'Mar', users: 200, newUsers: 50 },
      { month: 'Apr', users: 250, newUsers: 50 },
      { month: 'May', users: 300, newUsers: 50 },
      { month: 'Jun', users: 350, newUsers: 50 },
    ],
    schoolDistribution: schools.slice(0, 5).map(school => ({
      schoolName: school.name,
      userCount: Math.floor(Math.random() * 100) + 10,
      studentCount: Math.floor(Math.random() * 80) + 10,
      adminCount: Math.floor(Math.random() * 10) + 1,
    })),
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
      <div className="space-y-4 md:space-y-6" suppressHydrationWarning>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Users Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage all users across the platform
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => handleExport('csv')}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => handleExport('json')}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export JSON</span>
              <span className="sm:hidden">JSON</span>
            </Button>
            <Button
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => {
                setSelectedUser(null);
                setEditModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {stats && <UserSummaryStats stats={stats} loading={loading} />}

        {/* Analytics */}
        <UserAnalytics data={analyticsData} loading={loading} />

        {/* Filters */}
        <UserFilters
          filters={filters}
          onFiltersChange={setFilters}
          schools={schools}
          onExport={handleExport}
          selectedCount={selectedUsers.length}
          onBulkAction={handleBulkAction}
        />

        {/* User Table */}
        <UserTable
          users={users}
          onEdit={handleEditUser}
          onView={handleViewUser}
          onSuspend={handleSuspendUser}
          onReactivate={handleReactivateUser}
          onDelete={userId => {
            const user = users.find(u => u.id === userId);
            setSelectedUser(user || null);
            setDeleteModalOpen(true);
          }}
          onResetPassword={userId => {
            const user = users.find(u => u.id === userId);
            setSelectedUser(user || null);
            setResetPasswordModalOpen(true);
          }}
          selectedUsers={selectedUsers}
          onSelectionChange={setSelectedUsers}
          loading={loading}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} users
            </p>
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-xs sm:text-sm whitespace-nowrap">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditUserModal
        user={selectedUser}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        schools={schools}
        loading={loading}
      />

      <DeleteUserModal
        user={selectedUser}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        loading={loading}
      />

      <ResetPasswordModal
        user={selectedUser}
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleResetPassword}
        loading={loading}
      />

      <BulkActionModal
        isOpen={bulkActionModalOpen}
        onClose={() => setBulkActionModalOpen(false)}
        onConfirm={handleConfirmBulkAction}
        action={bulkAction}
        selectedCount={selectedUsers.length}
        loading={loading}
      />
    </DashboardLayout>
  );
}
