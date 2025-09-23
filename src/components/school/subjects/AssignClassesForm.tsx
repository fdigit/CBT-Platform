'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { useToast } from '../../../hooks/use-toast';
import { GraduationCap } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  employeeId: string;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
}

interface Class {
  id: string;
  name: string;
  section?: string;
  academicYear: string;
}

interface AssignClassesFormProps {
  classes: Class[];
  teachers: Teacher[];
  onAssignmentCreated: () => void;
}

export function AssignClassesForm({
  classes,
  teachers,
  onAssignmentCreated,
}: AssignClassesFormProps) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const { toast } = useToast();

  // Fetch teacher's subjects when teacher is selected
  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherSubjects(selectedTeacherId);
    } else {
      setAvailableSubjects([]);
      setSelectedSubjectIds([]);
    }
  }, [selectedTeacherId]);

  const fetchTeacherSubjects = async (teacherId: string) => {
    setLoadingSubjects(true);
    try {
      const response = await fetch(
        `/api/school/teachers/${teacherId}/subjects`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch teacher subjects');
      }

      const subjects = await response.json();
      setAvailableSubjects(subjects);
      setSelectedSubjectIds([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load teacher subjects',
        variant: 'destructive',
      });
      setAvailableSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedClassId ||
      !selectedTeacherId ||
      selectedSubjectIds.length === 0
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class, teacher, and at least one subject',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/school/subjects/assign-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClassId,
          teacherId: selectedTeacherId,
          subjectIds: selectedSubjectIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign subjects to class');
      }

      toast({
        title: 'Success',
        description: data.message || 'Subjects assigned to class successfully',
      });

      // Reset form
      setSelectedClassId('');
      setSelectedTeacherId('');
      setSelectedSubjectIds([]);
      setAvailableSubjects([]);
      onAssignmentCreated();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to assign subjects to class',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubjectIds(prev => [...prev, subjectId]);
    } else {
      setSelectedSubjectIds(prev => prev.filter(id => id !== subjectId));
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-purple-600" />
          Assign Teachers to Classes (with Subjects)
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Assign a teacher to teach specific subjects in a class
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="class">Select Class *</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map(classItem => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    <div className="flex items-center gap-2">
                      <span>{classItem.name}</span>
                      {classItem.section && (
                        <span className="text-xs text-gray-500">
                          Section {classItem.section}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {classItem.academicYear}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Select Teacher *</Label>
            <Select
              value={selectedTeacherId}
              onValueChange={setSelectedTeacherId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a teacher..." />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    <div className="flex items-center gap-2">
                      <span>{teacher.name}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {teacher.employeeId}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedTeacherId && (
          <div className="space-y-3">
            <Label>
              Select Subject(s) * ({selectedSubjectIds.length} selected)
              {loadingSubjects && (
                <span className="ml-2 text-sm text-blue-600">
                  Loading subjects...
                </span>
              )}
            </Label>

            {loadingSubjects ? (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              </div>
            ) : availableSubjects.length === 0 ? (
              <div className="border rounded-lg p-4">
                <p className="text-gray-500 text-center py-4">
                  {selectedTeacherId
                    ? 'This teacher is not assigned to any subjects yet.'
                    : 'Select a teacher to see available subjects.'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-3">
                  {availableSubjects.map(subject => (
                    <div
                      key={subject.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={subject.id}
                        checked={selectedSubjectIds.includes(subject.id)}
                        onCheckedChange={checked =>
                          handleSubjectToggle(subject.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={subject.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {subject.name}
                          </span>
                          {subject.code && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              {subject.code}
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              isLoading ||
              !selectedClassId ||
              !selectedTeacherId ||
              selectedSubjectIds.length === 0 ||
              loadingSubjects
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? 'Assigning...' : 'Assign to Class'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
