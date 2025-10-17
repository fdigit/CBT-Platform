'use client';

import { TargetAudience } from '@/types/models';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Textarea } from '../../ui/textarea';

interface CreateAnnouncementDialogProps {
  trigger?: React.ReactNode;
  announcement?: any; // For editing
  onSuccess: () => void;
}

interface ClassSubject {
  id: string;
  name: string;
  section?: string;
  subjectName: string;
}

export function CreateAnnouncementDialog({
  trigger,
  announcement,
  onSuccess,
}: CreateAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(
    TargetAudience.STUDENTS
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetType, setTargetType] = useState<
    'all-students' | 'specific-students'
  >('all-students');
  const [isPinned, setIsPinned] = useState(false);

  // Available classes/subjects
  const [availableClasses, setAvailableClasses] = useState<ClassSubject[]>([]);

  // Load available classes and subjects for the teacher
  useEffect(() => {
    const fetchClassSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/teacher/classes-subjects');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch classes and subjects');
        }

        setAvailableClasses(data.classSubjects || []);
      } catch (error) {
        console.error('Error fetching classes and subjects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load classes and subjects',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchClassSubjects();
    }
  }, [open]);

  // Load announcement data for editing
  useEffect(() => {
    if (announcement && open) {
      setTitle(announcement.title || '');
      setContent(announcement.content || '');
      setTargetAudience(announcement.targetAudience || 'STUDENTS');
      setSelectedClasses(announcement.classIds || []);
      setSelectedSubjects(announcement.subjectIds || []);
      setIsPinned(announcement.isPinned || false);
    } else if (!announcement && open) {
      // Reset form for new announcement
      setTitle('');
      setContent('');
      setTargetAudience(TargetAudience.STUDENTS);
      setSelectedClasses([]);
      setSelectedSubjects([]);
      setSelectedStudentIds([]);
      setTargetType('all-students');
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

    if (targetType === 'specific-students' && selectedStudentIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }

    if (
      targetType === 'all-students' &&
      selectedClasses.length === 0 &&
      selectedSubjects.length === 0
    ) {
      toast({
        title: 'Error',
        description: 'Please select at least one class or subject',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const url = announcement
        ? `/api/teacher/announcements/${announcement.id}`
        : '/api/teacher/announcements';

      const method = announcement ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetAudience,
          classIds: targetType === 'all-students' ? selectedClasses : undefined,
          subjectIds:
            targetType === 'all-students' ? selectedSubjects : undefined,
          recipientIds:
            targetType === 'specific-students' ? selectedStudentIds : undefined,
          isPinned,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to ${announcement ? 'update' : 'create'} announcement`
        );
      }

      setOpen(false);
      onSuccess();

      toast({
        title: 'Success',
        description: `Announcement ${announcement ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error(
        `Error ${announcement ? 'updating' : 'creating'} announcement:`,
        error
      );
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${announcement ? 'update' : 'create'} announcement`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClassToggle = (classSubjectId: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(classSubjectId)) {
        return prev.filter(id => id !== classSubjectId);
      } else {
        return [...prev, classSubjectId];
      }
    });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>New Announcement</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {announcement ? 'Edit Announcement' : 'Create New Announcement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter announcement title..."
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Enter announcement content..."
              className="min-h-[120px]"
              maxLength={5000}
              required
            />
            <p className="text-xs text-gray-500">
              {content.length}/5000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience *</Label>
            <Select
              value={targetAudience}
              onValueChange={(value: TargetAudience) =>
                setTargetAudience(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENTS">Students</SelectItem>
                <SelectItem value="TEACHERS">Teachers</SelectItem>
                <SelectItem value="ALL">Everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Type Selection for Students */}
          {targetAudience === 'STUDENTS' && (
            <div className="space-y-3">
              <Label>How would you like to target students?</Label>
              <RadioGroup
                value={targetType}
                onValueChange={value =>
                  setTargetType(value as 'all-students' | 'specific-students')
                }
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all-students" id="all-students" />
                    <Label htmlFor="all-students">
                      All Students in Selected Classes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="specific-students"
                      id="specific-students"
                    />
                    <Label htmlFor="specific-students">Specific Students</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Student Selection */}
          {targetAudience === 'STUDENTS' &&
            targetType === 'specific-students' && (
              <div className="space-y-3">
                <Label>Select Students</Label>
                <UserSelector
                  role="STUDENT"
                  selectedIds={selectedStudentIds}
                  onSelectionChange={setSelectedStudentIds}
                  fetchUrl="/api/teacher/students"
                  placeholder="Search students..."
                />
              </div>
            )}

          {loading ? (
            <div className="space-y-2">
              <Label>Your Classes & Subjects</Label>
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          ) : availableClasses.length > 0 &&
            targetAudience === 'STUDENTS' &&
            targetType === 'all-students' ? (
            <div className="space-y-4">
              <div>
                <Label>Target Specific Classes (Optional)</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Select specific classes to target this announcement to
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {availableClasses.map(classSubject => (
                    <label
                      key={classSubject.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(classSubject.id)}
                        onChange={() => handleClassToggle(classSubject.id)}
                        className="rounded"
                      />
                      <span>
                        {classSubject.name}
                        {classSubject.section &&
                          ` ${classSubject.section}`} -{' '}
                        {classSubject.subjectName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Target Specific Subjects (Optional)</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Select specific subjects to target this announcement to
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {Array.from(
                    new Set(availableClasses.map(cs => cs.subjectName))
                  ).map(subjectName => (
                    <label
                      key={subjectName}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subjectName)}
                        onChange={() => handleSubjectToggle(subjectName)}
                        className="rounded"
                      />
                      <span>{subjectName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Your Classes & Subjects</Label>
              <div className="text-sm text-gray-500">
                No classes or subjects assigned yet
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isPinned"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
            <Label htmlFor="isPinned">Pin this announcement</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : announcement ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
