'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Archive,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Image,
  Loader2,
  Music,
  Video,
} from 'lucide-react';
import { useState } from 'react';

interface Resource {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  resourceType: string;
  uploadedAt: string;
}

interface ResourcePreviewProps {
  resource: Resource;
  lessonPlanId: string;
}

export function ResourcePreview({
  resource,
  lessonPlanId,
}: ResourcePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/'))
      return <Image className="h-4 w-4 text-blue-500" />;
    if (mimeType.startsWith('video/'))
      return <Video className="h-4 w-4 text-purple-500" />;
    if (mimeType.startsWith('audio/'))
      return <Music className="h-4 w-4 text-green-500" />;
    if (mimeType.includes('pdf'))
      return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar'))
      return <Archive className="h-4 w-4 text-orange-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const getFileTypeBadge = (mimeType: string) => {
    if (mimeType.startsWith('image/'))
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Image
        </Badge>
      );
    if (mimeType.startsWith('video/'))
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Video
        </Badge>
      );
    if (mimeType.startsWith('audio/'))
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Audio
        </Badge>
      );
    if (mimeType.includes('pdf'))
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          PDF
        </Badge>
      );
    if (mimeType.includes('zip') || mimeType.includes('rar'))
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          Archive
        </Badge>
      );
    return <Badge variant="secondary">Document</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        `/api/lesson-plans/${lessonPlanId}/resources/${resource.id}/download`
      );

      if (response.ok) {
        // For Cloudinary URLs, the API redirects to the file
        // We can also create a direct download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resource.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      setPreviewError('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = () => {
    setPreviewError(null);
    setIsPreviewOpen(true);
  };

  const renderPreview = () => {
    if (resource.mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={resource.filePath}
            alt={resource.originalName}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            onError={() => setPreviewError('Failed to load image')}
          />
        </div>
      );
    }

    if (resource.mimeType.startsWith('video/')) {
      return (
        <div className="flex justify-center">
          <video
            src={resource.filePath}
            controls
            className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
            onError={() => setPreviewError('Failed to load video')}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (resource.mimeType.startsWith('audio/')) {
      return (
        <div className="flex justify-center">
          <audio
            src={resource.filePath}
            controls
            className="w-full max-w-md"
            onError={() => setPreviewError('Failed to load audio')}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (resource.mimeType.includes('pdf')) {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={`${resource.filePath}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border rounded-lg"
            title={resource.originalName}
            onError={() => setPreviewError('Failed to load PDF')}
          />
        </div>
      );
    }

    // For other file types, show file info and download option
    return (
      <div className="text-center py-8">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {resource.originalName}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          This file type cannot be previewed directly.
        </p>
        <Button onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download to View
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(resource.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {resource.originalName}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {getFileTypeBadge(resource.mimeType)}
                  <span className="text-xs text-gray-500">
                    {formatFileSize(resource.fileSize)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                {getFileIcon(resource.mimeType)}
                <span>{resource.originalName}</span>
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(resource.filePath, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-auto max-h-[calc(90vh-120px)]">
            {previewError ? (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview Error
                </h3>
                <p className="text-sm text-gray-500 mb-4">{previewError}</p>
                <Button onClick={handleDownload} disabled={isDownloading}>
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </>
                  )}
                </Button>
              </div>
            ) : (
              renderPreview()
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
