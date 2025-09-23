'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { Checkbox } from '../../ui/checkbox'
import { useToast } from '../../../hooks/use-toast'
import { Users } from 'lucide-react'

interface Teacher {
  id: string
  name: string
  email: string
  employeeId: string
}

interface Subject {
  id: string
  name: string
  code?: string
}

interface AssignTeachersFormProps {
  subjects: Subject[]
  teachers: Teacher[]
  onAssignmentCreated: () => void
}

export function AssignTeachersForm({ 
  subjects, 
  teachers, 
  onAssignmentCreated 
}: AssignTeachersFormProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSubjectId || selectedTeacherIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a subject and at least one teacher',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/school/subjects/assign-teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          teacherIds: selectedTeacherIds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign teachers')
      }

      toast({
        title: 'Success',
        description: data.message || 'Teachers assigned successfully'
      })

      // Reset form
      setSelectedSubjectId('')
      setSelectedTeacherIds([])
      onAssignmentCreated()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign teachers',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeacherToggle = (teacherId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeacherIds(prev => [...prev, teacherId])
    } else {
      setSelectedTeacherIds(prev => prev.filter(id => id !== teacherId))
    }
  }

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Assign Teachers to Subjects
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Select a subject and assign teachers who can teach it
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject">Select Subject *</Label>
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a subject..." />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  <div className="flex items-center gap-2">
                    <span>{subject.name}</span>
                    {subject.code && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {subject.code}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSubjectId && (
          <div className="space-y-3">
            <Label>Select Teachers * ({selectedTeacherIds.length} selected)</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {teachers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No teachers available. Add teachers first.
                </p>
              ) : (
                <div className="space-y-3">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={teacher.id}
                        checked={selectedTeacherIds.includes(teacher.id)}
                        onCheckedChange={(checked) => 
                          handleTeacherToggle(teacher.id, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={teacher.id} 
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {teacher.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {teacher.email}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {teacher.employeeId}
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading || !selectedSubjectId || selectedTeacherIds.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Assigning...' : 'Assign Teachers'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
