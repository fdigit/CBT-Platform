'use client';

import { AnnouncementComment } from '@/types/models';
import { formatDistanceToNow } from 'date-fns';
import { Edit, MoreHorizontal, Reply, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from '../../../hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { CommentForm } from './CommentForm';

interface CommentThreadProps {
  comment: AnnouncementComment & {
    replies?: (AnnouncementComment & {
      author?: {
        id: string;
        name: string;
        email: string;
      };
    })[];
  };
  announcementId: string;
  onCommentUpdated: () => void;
  onCommentDeleted: () => void;
}

export function CommentThread({
  comment,
  announcementId,
  onCommentUpdated,
  onCommentDeleted,
}: CommentThreadProps) {
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = session?.user?.id === comment.authorId;
  const authorName = comment.author?.name || 'Unknown User';

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/announcements/${announcementId}/comments/${comment.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: editContent.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update comment');
      }

      setIsEditing(false);
      onCommentUpdated();
      
      toast({
        title: 'Success',
        description: 'Comment updated successfully',
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update comment',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/announcements/${announcementId}/comments/${comment.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      onCommentDeleted();
      
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const handleReplyAdded = () => {
    setIsReplying(false);
    onCommentUpdated();
  };

  return (
    <div className="space-y-4">
      {/* Main Comment */}
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className="bg-blue-100 text-blue-800 text-sm font-medium">
            {authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-sm text-gray-900">{authorName}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={!editContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs text-gray-600 hover:text-blue-600 h-auto p-1"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer">
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 cursor-pointer">
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-11">
          <CommentForm
            announcementId={announcementId}
            parentCommentId={comment.id}
            onCommentAdded={handleReplyAdded}
            onCancel={() => setIsReplying(false)}
            placeholder={`Reply to ${authorName}...`}
            replyTo={authorName}
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              announcementId={announcementId}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
