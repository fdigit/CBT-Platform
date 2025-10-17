'use client';

import { AnnouncementCard } from '@/components/shared/announcements/AnnouncementCard';
import { StudentDashboardLayout } from '@/components/student/StudentDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Announcement, AnnouncementListResponse } from '@/types/models';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StudentAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [authorRole, setAuthorRole] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(authorRole !== 'all' && { authorRole }),
      });

      const response = await fetch(`/api/student/announcements?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data: AnnouncementListResponse = await response.json();

      setAnnouncements(data.announcements);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to fetch announcements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'STUDENT') {
      fetchAnnouncements();
    }
  }, [page, search, authorRole, session]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (value: string) => {
    setAuthorRole(value);
    setPage(1); // Reset to first page when filtering
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

  if (!session || session.user.role !== 'STUDENT') {
    return null;
  }

  if (loading && announcements.length === 0) {
    return (
      <StudentDashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Announcements
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Stay updated with the latest announcements from your school and
              teachers
            </p>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Announcements
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Stay updated with the latest announcements from your school and
            teachers
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search announcements..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Select value={authorRole} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] border-gray-300">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="school_admin">School Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No announcements found</p>
            <p className="text-gray-400 mt-2">
              {search || authorRole !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No announcements have been posted yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                href={`/student/announcements/${announcement.id}`}
                showAuthor={true}
                showAudience={true}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="border-gray-300 hover:bg-gray-50"
            >
              Previous
            </Button>

            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
              className="border-gray-300 hover:bg-gray-50"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </StudentDashboardLayout>
  );
}
