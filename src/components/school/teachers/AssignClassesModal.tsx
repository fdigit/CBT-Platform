'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Checkbox } from '../../ui/checkbox'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { useToast } from '../../../hooks/use-toast'
import { Teacher } from '../../app/school/teachers/page'
import { Users, Search, BookOpen } from 'lucide-react'

interface AssignClassesModalProps {
  isOpen: boolean
  onClose: () => void
  onTeacherUpdated: (teacher: Teacher) => void
  teacher: Teacher | null
}

interface ClassOption {
  id: string
  name: string
  section?: string
  academicYear: string
  displayName: string
  studentCount: number
  maxStudents: number
  isAssigned: boolean
}

interface ClassAssignmentData {
  assignedClasses: ClassOption[]
  availableClasses: ClassOption[]
}

export function AssignClassesModal({ isOpen, onClose, onTeacherUpdated, teacher }: AssignClassesModalProps) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [classData, setClassData] = useState<ClassAssignmentData | null>(null)
  const { toast } = useToast()

  // Fetch class assignment data when modal opens
  useEffect(() => {
    if (isOpen && teacher) {
      fetchClassAssignmentData()
    }
  }, [isOpen, teacher])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setSelectedClassIds([])
      setClassData(null)
    }
  }, [isOpen])

  const fetchClassAssignmentData = async () => {
    if (!teacher) return

    setLoading(true)
    try {
      const response = await fetch(`/api/school/teachers/${teacher.id}/assign-classes`)
      if (response.ok) {
        const data = await response.json()
        setClassData(data)
        setSelectedClassIds(data.assignedClasses.map((c: ClassOption) => c.id))
      } else {
        throw new Error('Failed to fetch class data')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load class assignment data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!teacher || selectedClassIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one class',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/school/teachers/${teacher.id}/assign-classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classIds: selectedClassIds
        })
      })

      if (response.ok) {
        const result = await response.json()
        onTeacherUpdated(result.teacher)
        onClose()
        
        toast({
          title: 'Success',
          description: `Class assignments updated successfully. ${result.summary.added} added, ${result.summary.removed} removed.`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to update class assignments',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update class assignments',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const filteredClasses = classData?.availableClasses.filter(cls =>
    cls.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.academicYear.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const selectedCount = selectedClassIds.length
  const currentlyAssignedCount = classData?.assignedClasses.length || 0

  if (!teacher) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Classes to {teacher.name}</DialogTitle>
          <p className="text-sm text-gray-600">
            Select classes to assign to this teacher. Currently assigned to {currentlyAssignedCount} class{currentlyAssignedCount !== 1 ? 'es' : ''}.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search classes by name or academic year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">
                {selectedCount} class{selectedCount !== 1 ? 'es' : ''} selected
              </span>
            </div>
            {selectedCount > 0 && (
              <Badge variant="secondary">
                {selectedCount > currentlyAssignedCount ? `+${selectedCount - currentlyAssignedCount}` : 
                 selectedCount < currentlyAssignedCount ? `-${currentlyAssignedCount - selectedCount}` : 
                 'No change'}
              </Badge>
            )}
          </div>

          {/* Classes List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading classes...</p>
                </div>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No classes match your search' : 'No classes available'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredClasses.map((classItem) => (
                  <div 
                    key={classItem.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      selectedClassIds.includes(classItem.id) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      id={`class-${classItem.id}`}
                      checked={selectedClassIds.includes(classItem.id)}
                      onCheckedChange={() => handleClassToggle(classItem.id)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`class-${classItem.id}`}
                        className="text-sm font-medium cursor-pointer flex items-center space-x-2"
                      >
                        <span>{classItem.displayName}</span>
                        {classItem.isAssigned && (
                          <Badge variant="outline" className="text-xs">
                            Currently Assigned
                          </Badge>
                        )}
                      </label>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-xs text-gray-500">
                          Academic Year: {classItem.academicYear}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {classItem.studentCount}/{classItem.maxStudents} students
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || loading || selectedClassIds.length === 0}
          >
            {submitting ? 'Updating...' : 'Update Assignments'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
