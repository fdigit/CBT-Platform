'use client';

import { useEffect, useState } from 'react';
import { toast } from '../../../hooks/use-toast';
import { UserSelector } from '../../shared/announcements/UserSelector';
import { Button } from '../../ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Textarea } from '../../ui/textarea';

interface CreateSchoolAnnouncementDialogProps {
  trigger?: React.ReactNode;
  announcement?: any; // For editing
  onSuccess: () => void;
}

type TargetType = 'all-teachers' | 'all-students' | 'specific-teachers' | 'specific-students' | 'custom-mix';

export function CreateSchoolAnnouncementDialog({
  trigger,
  announcement,
  onSuccess,
}: CreateSchoolAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('all-students');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);

  // Load announcement data for editing
  useEffect(() => {
    if (announcement && open) {
      setTitle(announcement.title || '');
      setContent(announcement.content || '');
      setIsPinned(announcement.isPinned || false);
      
      // Determine target type based on announcement data
      if (announcement.recipientIds && announcement.recipientIds.length > 0) {
        // This is a specific user announcement - we'd need to determine if it's teachers, students, or mixed
        // For now, default to custom-mix
        setTargetType('custom-mix');
        // Note: We'd need to fetch user details to properly populate selectedTeacherIds/selectedStudentIds
      } else if (announcement.targetAudience === 'TEACHERS') {
        setTargetType('all-teachers');
      } else if (announcement.targetAudience === 'STUDENTS') {
        setTargetType('all-students');
      } else {
        setTargetType('all-students'); // Default
      }
    } else if (!announcement && open) {
      // Reset form for new announcement
      setTitle('');
      setContent('');
      setTargetType('all-students');
      setSelectedTeacherIds([]);
      setSelectedStudentIds([]);
      setIsPinned(false);
    }
  }, [announcement, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate selection based on target type
    if (targetType === 'specific-teachers' && selectedTeacherIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one teacher',
        variant: 'destructive',
      });
      return;
    }

    if (targetType === 'specific-students' && selectedStudentIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }

    if (targetType === 'custom-mix' && selectedTeacherIds.length === 0 && selectedStudentIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one teacher or student',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Prepare request data
      const requestData: any = {
        title: title.trim(),
        content: content.trim(),
        isPinned,
      };

      // Determine target audience and recipient IDs
      if (targetType === 'all-teachers') {
        requestData.targetAudience = 'TEACHERS';
      } else if (targetType === 'all-students') {
        requestData.targetAudience = 'STUDENTS';
      } else if (targetType === 'specific-teachers') {
        requestData.targetAudience = 'TEACHERS';
        requestData.recipientIds = selectedTeacherIds;
      } else if (targetType === 'specific-students') {
        requestData.targetAudience = 'STUDENTS';
        requestData.recipientIds = selectedStudentIds;
      } else if (targetType === 'custom-mix') {
        requestData.targetAudience = 'ALL';
        requestData.recipientIds = [...selectedTeacherIds, ...selectedStudentIds];
      }

      const url = announcement 
        ? `/api/school/announcements/${announcement.id}`
        : '/api/school/announcements';
      
      const method = announcement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save announcement');
      }

      toast({
        title: 'Success',
        description: announcement ? 'Announcement updated successfully' : 'Announcement created successfully',
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save announcement',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetAudienceLabel = () => {
    switch (targetType) {
      case 'all-teachers':
        return 'All Teachers';
      case 'all-students':
        return 'All Students';
      case 'specific-teachers':
        return `${selectedTeacherIds.length} Teacher${selectedTeacherIds.length === 1 ? '' : 's'}`;
      case 'specific-students':
        return `${selectedStudentIds.length} Student${selectedStudentIds.length === 1 ? '' : 's'}`;
      case 'custom-mix':
        const total = selectedTeacherIds.length + selectedStudentIds.length;
        return `${total} User${total === 1 ? '' : 's'} (${selectedTeacherIds.length} teachers, ${selectedStudentIds.length} students)`;
      default:
        return 'All Students';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            New Announcement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {announcement ? 'Edit Announcement' : 'Create New Announcement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter announcement content"
                rows={6}
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="isPinned">Pin this announcement</Label>
            </div>
          </div>

          {/* Target Selection */}
          <div className="space-y-4">
            <Label>Target Audience</Label>
            <RadioGroup value={targetType} onValueChange={(value) => setTargetType(value as TargetType)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all-teachers" id="all-teachers" />
                  <Label htmlFor="all-teachers">All Teachers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all-students" id="all-students" />
                  <Label htmlFor="all-students">All Students</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific-teachers" id="specific-teachers" />
                  <Label htmlFor="specific-teachers">Specific Teachers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific-students" id="specific-students" />
                  <Label htmlFor="specific-students">Specific Students</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom-mix" id="custom-mix" />
                  <Label htmlFor="custom-mix">Custom Mix (Teachers & Students)</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* User Selection */}
          {(targetType === 'specific-teachers' || targetType === 'specific-students' || targetType === 'custom-mix') && (
            <div className="space-y-4">
              <Label>Select Recipients</Label>
              
              {targetType === 'custom-mix' ? (
                <Tabs defaultValue="teachers" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                  </TabsList>
                  <TabsContent value="teachers" className="space-y-4">
                    <UserSelector
                      role="TEACHER"
                      selectedIds={selectedTeacherIds}
                      onSelectionChange={setSelectedTeacherIds}
                      fetchUrl="/api/school/users"
                      placeholder="Search teachers..."
                    />
                  </TabsContent>
                  <TabsContent value="students" className="space-y-4">
                    <UserSelector
                      role="STUDENT"
                      selectedIds={selectedStudentIds}
                      onSelectionChange={setSelectedStudentIds}
                      fetchUrl="/api/school/users"
                      placeholder="Search students..."
                    />
                  </TabsContent>
                </Tabs>
              ) : targetType === 'specific-teachers' ? (
                <UserSelector
                  role="TEACHER"
                  selectedIds={selectedTeacherIds}
                  onSelectionChange={setSelectedTeacherIds}
                  fetchUrl="/api/school/users"
                  placeholder="Search teachers..."
                />
              ) : (
                <UserSelector
                  role="STUDENT"
                  selectedIds={selectedStudentIds}
                  onSelectionChange={setSelectedStudentIds}
                  fetchUrl="/api/school/users"
                  placeholder="Search students..."
                />
              )}
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Announcement Summary</h4>
            <p className="text-sm text-gray-600">
              <strong>Title:</strong> {title || 'Untitled'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Target:</strong> {getTargetAudienceLabel()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Pinned:</strong> {isPinned ? 'Yes' : 'No'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Saving...' : (announcement ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
