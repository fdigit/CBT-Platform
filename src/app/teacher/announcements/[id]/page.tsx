'use client';

import { CommentForm } from '@/components/shared/announcements/CommentForm';
import { CommentThread } from '@/components/shared/announcements/CommentThread';
import { CreateAnnouncementDialog } from '@/components/teacher/announcements/CreateAnnouncementDialog';
import { TeacherDashboardLayout } from '@/components/teacher/TeacherDashboardLayout';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Announcement, AnnouncementComment } from '@/types/models';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Edit, MoreHorizontal, Pin, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TeacherAnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const announcementId = params.id as string;

  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/announcements/${announcementId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch announcement');
      }

      setAnnouncement(data.announcement);
      setComments(data.announcement.comments || []);
    } catch (error) {
      console.error('Error fetching announcement:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch announcement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/announcements/${announcementId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete announcement');
      }

      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
      });

      router.push('/teacher/announcements');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  };

  const handleCommentAdded = () => {
    fetchAnnouncement(); // Refresh to get new comments
  };

  const handleCommentUpdated = () => {
    fetchAnnouncement(); // Refresh to get updated comments
  };

  const handleCommentDeleted = () => {
    fetchAnnouncement(); // Refresh to get updated comments
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    fetchAnnouncement(); // Refresh to get updated announcement
  };

  useEffect(() => {
    if (announcementId) {
      fetchAnnouncement();
    }
  }, [announcementId]);

  if (loading) {
    return (
      <TeacherDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </TeacherDashboardLayout>
    );
  }

  if (!announcement) {
    return (
      <TeacherDashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Announcement not found</p>
          <Button onClick={() => router.push('/teacher/announcements')} className="mt-4">
            Back to Announcements
          </Button>
        </div>
      </TeacherDashboardLayout>
    );
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/teacher/announcements')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-2">
              {announcement.isPinned && (
                <Pin className="h-5 w-5 text-yellow-500" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{announcement.title}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <CreateAnnouncementDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              }
              announcement={announcement}
              onSuccess={handleEditSuccess}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Announcement Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>By {announcement.author?.name || 'Unknown User'}</span>
              <span>
                {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
              </span>
              {announcement.updatedAt !== announcement.createdAt && (
                <span>(edited)</span>
              )}
            </div>
          </div>
          
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {announcement.content}
            </p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Comments ({comments.length})
          </h3>

          {/* Comment Form */}
          <div className="mb-6">
            <CommentForm
              announcementId={announcementId}
              onCommentAdded={handleCommentAdded}
              placeholder="Add a comment..."
            />
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  announcementId={announcementId}
                  onCommentUpdated={handleCommentUpdated}
                  onCommentDeleted={handleCommentDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherDashboardLayout>
  );
}
