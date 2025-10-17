'use client';

import { Announcement, TargetAudience } from '@/types/models';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Pin, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader } from '../../ui/card';

interface AnnouncementCardProps {
  announcement: Announcement & {
    author?: {
      id: string;
      name: string;
      email: string;
    };
    _count?: {
      comments: number;
    };
  };
  href: string;
  showAuthor?: boolean;
  showAudience?: boolean;
}

const getAudienceLabel = (audience: TargetAudience) => {
  switch (audience) {
    case 'STUDENTS':
      return 'Students';
    case 'TEACHERS':
      return 'Teachers';
    case 'ALL':
      return 'Everyone';
    default:
      return audience;
  }
};

const getAudienceColor = (audience: TargetAudience) => {
  switch (audience) {
    case 'STUDENTS':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'TEACHERS':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ALL':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function AnnouncementCard({
  announcement,
  href,
  showAuthor = true,
  showAudience = true,
}: AnnouncementCardProps) {
  const authorName = announcement.author?.name || 'Unknown User';
  const commentCount = announcement._count?.comments || 0;

  // Truncate content for preview
  const contentPreview =
    announcement.content.length > 150
      ? `${announcement.content.substring(0, 150)}...`
      : announcement.content;

  return (
    <Card className="hover:shadow-md transition-all duration-200 border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {announcement.isPinned && (
                <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight">
                <Link
                  href={href}
                  className="hover:text-blue-600 transition-colors"
                >
                  {announcement.title}
                </Link>
              </h3>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {showAuthor && (
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{authorName}</span>
                </div>
              )}

              <span className="text-gray-500">
                {formatDistanceToNow(new Date(announcement.createdAt), {
                  addSuffix: true,
                })}
              </span>

              {commentCount > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>
                    {commentCount} comment{commentCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {showAudience && (
            <Badge
              className={`${getAudienceColor(announcement.targetAudience)} ml-2 flex-shrink-0`}
            >
              {getAudienceLabel(announcement.targetAudience)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          {contentPreview}
        </p>

        {announcement.content.length > 150 && (
          <div className="flex justify-end">
            <Link
              href={href}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Read more →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
