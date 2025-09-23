'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { useToast } from '../../../hooks/use-toast';
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

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassUpdated: (classItem: Class) => void;
  classItem: Class | null;
  teachers: Teacher[];
}

const ACADEMIC_YEARS = ['2025/2026', '2024/2025', '2023/2024'];

const CLASS_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function EditClassModal({
  isOpen,
  onClose,
  onClassUpdated,
  classItem,
  teachers,
}: EditClassModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    academicYear: '',
    description: '',
    maxStudents: 40,
    room: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
  });
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Initialize form when classItem changes
  useEffect(() => {
    if (classItem && isOpen) {
      setFormData({
        name: classItem.name,
        section: classItem.section || '',
        academicYear: classItem.academicYear,
        description: classItem.description || '',
        maxStudents: classItem.maxStudents,
        room: classItem.room || '',
        status: classItem.status,
      });
      setSelectedTeachers(classItem.teachers.map(t => t.id));
      setErrors({});
    }
  }, [classItem, isOpen]);

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form after a brief delay to allow modal to close
      setTimeout(() => {
        setFormData({
          name: '',
          section: '',
          academicYear: '',
          description: '',
          maxStudents: 40,
          room: '',
          status: 'ACTIVE',
        });
        setSelectedTeachers([]);
        setErrors({});
      }, 200);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    }

    if (!formData.academicYear) {
      newErrors.academicYear = 'Academic year is required';
    }

    if (formData.maxStudents < 1) {
      newErrors.maxStudents = 'Maximum students must be at least 1';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    } else {
      setErrors({});
      return true;
    }
  };

  const handleSubmit = async () => {
    if (!classItem || !validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/school/classes/${classItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacherIds: selectedTeachers,
        }),
      });

      if (response.ok) {
        const updatedClass = await response.json();
        onClassUpdated(updatedClass);
        handleClose();

        toast({
          title: 'Success',
          description: 'Class updated successfully',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to update class',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update class',
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

  if (!classItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., SS 1, JSS 2, Grade 5"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={e =>
                  setFormData(prev => ({ ...prev, section: e.target.value }))
                }
                placeholder="e.g., A, B, C"
              />
            </div>

            <div>
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Select
                value={formData.academicYear}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, academicYear: value }))
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
                <p className="text-sm text-red-500 mt-1">
                  {errors.academicYear}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxStudents">Maximum Students *</Label>
              <Input
                id="maxStudents"
                type="number"
                min="1"
                value={formData.maxStudents}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    maxStudents: parseInt(e.target.value) || 0,
                  }))
                }
                className={errors.maxStudents ? 'border-red-500' : ''}
              />
              {errors.maxStudents && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.maxStudents}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="room">Room/Location</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={e =>
                  setFormData(prev => ({ ...prev, room: e.target.value }))
                }
                placeholder="e.g., Room 101, Lab A"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Optional class description..."
              rows={3}
            />
          </div>

          {/* Teacher Assignment */}
          <div>
            <Label className="text-base font-medium">Assign Teachers</Label>
            <p className="text-sm text-gray-600 mb-3">
              Select teachers to assign to this class
            </p>

            {availableTeachers.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 border rounded-lg">
                No active teachers available. Please add teachers first.
              </p>
            ) : (
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-3">
                {availableTeachers.map(teacher => (
                  <div key={teacher.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`teacher-${teacher.id}`}
                      checked={selectedTeachers.includes(teacher.id)}
                      onCheckedChange={() => handleTeacherToggle(teacher.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`teacher-${teacher.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {teacher.name}
                      </label>
                      <p className="text-xs text-gray-500">
                        {teacher.email} • ID: {teacher.employeeId}
                      </p>
                      {teacher.specialization && (
                        <p className="text-xs text-gray-500">
                          Specialization: {teacher.specialization}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTeachers.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                {selectedTeachers.length} teacher
                {selectedTeachers.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Updating...' : 'Update Class'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
