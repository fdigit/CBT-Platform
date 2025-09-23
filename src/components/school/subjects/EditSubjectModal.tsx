'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { useToast } from '../../../hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: string;
  createdAt: string;
  _count: {
    teachers: number;
    classSubjects: number;
  };
}

interface EditSubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSubjectUpdated: (subject: Subject) => void;
}

export function EditSubjectModal({
  subject,
  isOpen,
  onClose,
  onSubjectUpdated,
}: EditSubjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        code: subject.code || '',
        description: subject.description || '',
        status: subject.status,
      });
    }
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/school/subjects/${subject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code || undefined,
          description: formData.description || undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update subject');
      }

      toast({
        title: 'Success',
        description: 'Subject updated successfully',
      });

      onSubjectUpdated(data);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update subject',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the subject information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Subject Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Mathematics, English Language"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-code">Subject Code</Label>
            <Input
              id="edit-code"
              value={formData.code}
              onChange={e => handleChange('code', e.target.value)}
              placeholder="e.g., MATH101, ENG101"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Brief description of the subject..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={value => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Updating...' : 'Update Subject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
