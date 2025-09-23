'use client';

import { useState } from 'react';
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
import { Badge } from '../../ui/badge';
import { X } from 'lucide-react';
// Define types locally instead of importing from page
interface Class {
  id: string;
  name: string;
  section?: string;
  academicYear: string;
  description?: string;
  maxStudents: number;
  room?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  studentCount: number;
  examCount: number;
  teachers: Array<{
    id: string;
    name: string;
    email: string;
    employeeId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';
}
import { useToast } from '../../../hooks/use-toast';
import { z } from 'zod';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassAdded: (classItem: Class) => void;
  teachers: Teacher[];
}

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  description: z.string().optional(),
  maxStudents: z.number().int().positive('Max students must be positive'),
  room: z.string().optional(),
});

const ACADEMIC_YEARS = ['2024/2025', '2025/2026', '2023/2024'];

export function AddClassModal({
  isOpen,
  onClose,
  onClassAdded,
  teachers,
}: AddClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    academicYear: '2024/2025',
    description: '',
    maxStudents: 40,
    room: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      section: '',
      academicYear: '2024/2025',
      description: '',
      maxStudents: 40,
      room: '',
    });
    setSelectedTeachers([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    try {
      classSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/school/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacherIds: selectedTeachers,
        }),
      });

      if (response.ok) {
        const newClass = await response.json();
        onClassAdded(newClass);
        handleClose();

        toast({
          title: 'Success',
          description: 'Class created successfully',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to create class',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create class',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherToggle = (teacherId: string) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const availableTeachers = teachers.filter(t => t.status === 'ACTIVE');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Create a new class and assign teachers to manage students
            effectively.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., SS 1, JSS 2, Grade 5"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={e =>
                  setFormData({ ...formData, section: e.target.value })
                }
                placeholder="e.g., A, B, C"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Select
                value={formData.academicYear}
                onValueChange={value =>
                  setFormData({ ...formData, academicYear: value })
                }
              >
                <SelectTrigger
                  className={errors.academicYear ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academicYear && (
                <p className="text-sm text-red-500">{errors.academicYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStudents">Max Students *</Label>
              <Input
                id="maxStudents"
                type="number"
                value={formData.maxStudents}
                onChange={e =>
                  setFormData({
                    ...formData,
                    maxStudents: parseInt(e.target.value) || 0,
                  })
                }
                className={errors.maxStudents ? 'border-red-500' : ''}
              />
              {errors.maxStudents && (
                <p className="text-sm text-red-500">{errors.maxStudents}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room/Location</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={e =>
                  setFormData({ ...formData, room: e.target.value })
                }
                placeholder="e.g., Room 101, Block A"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description for the class"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign Teachers ({selectedTeachers.length} selected)</Label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              {availableTeachers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No active teachers available
                </p>
              ) : (
                <div className="space-y-2">
                  {availableTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`teacher-${teacher.id}`}
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={() => handleTeacherToggle(teacher.id)}
                        className="rounded"
                      />
                      <label
                        htmlFor={`teacher-${teacher.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        <span className="font-medium">{teacher.name}</span>
                        <span className="text-gray-500 ml-2">
                          ({teacher.employeeId})
                        </span>
                        {teacher.specialization && (
                          <span className="text-blue-600 ml-2">
                            • {teacher.specialization}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedTeachers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTeachers.map(teacherId => {
                  const teacher = teachers.find(t => t.id === teacherId);
                  return teacher ? (
                    <Badge
                      key={teacherId}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {teacher.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleTeacherToggle(teacherId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
