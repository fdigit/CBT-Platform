'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from '../../../hooks/use-toast';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

interface CommentFormProps {
  announcementId: string;
  parentCommentId?: string;
  onCommentAdded: () => void;
  onCancel?: () => void;
  placeholder?: string;
  replyTo?: string; // Name of the person being replied to
}

export function CommentForm({
  announcementId,
  parentCommentId,
  onCommentAdded,
  onCancel,
  placeholder = 'Write a comment...',
  replyTo,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          parentCommentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment');
      }

      setContent('');
      onCommentAdded();
      
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyTo && (
        <div className="text-sm text-gray-600">
          Replying to <span className="font-medium">{replyTo}</span>
        </div>
      )}
      
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        maxLength={1000}
        disabled={isSubmitting}
      />
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {content.length}/1000 characters
        </div>
        
        <div className="flex items-center space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Posting...' : parentCommentId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
    </form>
  );
}
