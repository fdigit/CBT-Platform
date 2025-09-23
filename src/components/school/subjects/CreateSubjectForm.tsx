'use client';

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useToast } from '../../../hooks/use-toast';

interface CreateSubjectFormProps {
  onSubjectCreated: (subject: any) => void;
}

export interface CreateSubjectFormRef {
  focus: () => void;
}

export const CreateSubjectForm = forwardRef<
  CreateSubjectFormRef,
  CreateSubjectFormProps
>(({ onSubjectCreated }, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      nameInputRef.current?.focus();
    },
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Creating subject with data:', {
      name: formData.name,
      code: formData.code || undefined,
      description: formData.description || undefined,
    });

    try {
      const response = await fetch('/api/school/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code || undefined,
          description: formData.description || undefined,
        }),
      });

      const data = await response.json();
      console.log('API response:', { status: response.status, data });

      if (!response.ok) {
        console.error('API error:', data);
        throw new Error(data.message || 'Failed to create subject');
      }

      toast({
        title: 'Success',
        description: 'Subject created successfully',
      });

      onSubjectCreated(data);

      // Reset form
      setFormData({
        name: '',
        code: '',
        description: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create subject',
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

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Create New Subject
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Add a new subject to your school curriculum
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              ref={nameInputRef}
              id="name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Mathematics, English Language"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Subject Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={e => handleChange('code', e.target.value)}
              placeholder="e.g., MATH101, ENG101"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Brief description of the subject..."
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Creating...' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Card>
  );
});
