'use client';

import { Announcement, AnnouncementListResponse } from '@/types/models';
import { useEffect, useState } from 'react';
import { toast } from '../../../hooks/use-toast';
import { AnnouncementCard } from '../../shared/announcements/AnnouncementCard';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';
import { Skeleton } from '../../ui/skeleton';
import { CreateSchoolAnnouncementDialog } from './CreateSchoolAnnouncementDialog';

interface SchoolAnnouncementListProps {
  onCreateNew?: () => void;
  refreshTrigger?: number;
}

export function SchoolAnnouncementList({ onCreateNew, refreshTrigger }: SchoolAnnouncementListProps = {}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [authorRole, setAuthorRole] = useState('all');
  const [isPinned, setIsPinned] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
       const params = new URLSearchParams({
         page: page.toString(),
         limit: '20',
         ...(search && { search }),
         ...(targetAudience !== 'all' && { targetAudience }),
         ...(authorRole !== 'all' && { authorRole }),
         ...(isPinned !== 'all' && { isPinned }),
       });

      const response = await fetch(`/api/school/announcements?${params}`);
      
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
        description: error instanceof Error ? error.message : 'Failed to fetch announcements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, search, targetAudience, authorRole, isPinned, refreshTrigger]);

  const handleCreateNew = () => {
    fetchAnnouncements();
    onCreateNew?.();
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'targetAudience') {
      setTargetAudience(value);
    } else if (key === 'authorRole') {
      setAuthorRole(value);
    } else if (key === 'isPinned') {
      setIsPinned(value);
    }
    setPage(1); // Reset to first page when filtering
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">School Announcements</h2>
          <CreateSchoolAnnouncementDialog onSuccess={handleCreateNew} />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">School Announcements</h2>
        <CreateSchoolAnnouncementDialog onSuccess={handleCreateNew} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
         <Select value={targetAudience} onValueChange={(value) => handleFilterChange('targetAudience', value)}>
           <SelectTrigger className="w-full sm:w-[180px]">
             <SelectValue placeholder="Audience" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Audiences</SelectItem>
             <SelectItem value="students">Students</SelectItem>
             <SelectItem value="teachers">Teachers</SelectItem>
             <SelectItem value="everyone">Everyone</SelectItem>
           </SelectContent>
         </Select>
         
         <Select value={authorRole} onValueChange={(value) => handleFilterChange('authorRole', value)}>
           <SelectTrigger className="w-full sm:w-[140px]">
             <SelectValue placeholder="Author" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Authors</SelectItem>
             <SelectItem value="teacher">Teachers</SelectItem>
             <SelectItem value="school_admin">Admins</SelectItem>
           </SelectContent>
         </Select>
         
         <Select value={isPinned} onValueChange={(value) => handleFilterChange('isPinned', value)}>
           <SelectTrigger className="w-full sm:w-[140px]">
             <SelectValue placeholder="Pinned" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All</SelectItem>
             <SelectItem value="true">Pinned</SelectItem>
             <SelectItem value="false">Not Pinned</SelectItem>
           </SelectContent>
         </Select>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No announcements found</p>
           <p className="text-gray-400 mt-2">
             {search || targetAudience !== 'all' || authorRole !== 'all' || isPinned !== 'all'
               ? 'Try adjusting your search or filters'
               : 'No announcements have been posted yet'}
           </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              href={`/school/announcements/${announcement.id}`}
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
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
