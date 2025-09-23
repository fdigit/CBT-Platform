'use client'

import { useState } from 'react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet'
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  MapPin,
  Calendar,
  Edit3
} from 'lucide-react'
// Define types locally instead of importing from page
interface Class {
  id: string
  name: string
  section?: string
  academicYear: string
  description?: string
  maxStudents: number
  room?: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  studentCount: number
  examCount: number
  teachers: Array<{
    id: string
    name: string
    email: string
    employeeId: string
  }>
  createdAt: string
  updatedAt: string
}

interface Teacher {
  id: string
  employeeId: string
  name: string
  email: string
  qualification?: string
  specialization?: string
  experience?: number
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE'
  classCount: number
  classes: Array<{
    id: string
    name: string
    section?: string
  }>
}
import { EditClassModal } from './EditClassModal'

interface ClassProfileDrawerProps {
  classItem: Class | null
  isOpen: boolean
  onClose: () => void
  onClassUpdate: (classItem: Class) => void
  teachers: Teacher[]
}

export function ClassProfileDrawer({ 
  classItem, 
  isOpen, 
  onClose, 
  onClassUpdate,
  teachers
}: ClassProfileDrawerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  if (!classItem) return null

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800' },
      INACTIVE: { label: 'Inactive', className: 'bg-yellow-100 text-yellow-800' },
      ARCHIVED: { label: 'Archived', className: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const capacityPercentage = classItem.maxStudents > 0 
    ? Math.round((classItem.studentCount / classItem.maxStudents) * 100)
    : 0

  const getCapacityColor = () => {
    if (capacityPercentage > 100) return 'text-red-600'
    if (capacityPercentage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>
                {classItem.name}
                {classItem.section && ` - ${classItem.section}`}
              </SheetTitle>
              <SheetDescription>
                {classItem.academicYear} • {classItem.studentCount} students
              </SheetDescription>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(classItem.status)}
              <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Students</p>
                    <p className={`text-2xl font-bold ${getCapacityColor()}`}>
                      {classItem.studentCount}/{classItem.maxStudents}
                    </p>
                    <p className="text-xs text-gray-500">{capacityPercentage}% capacity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Teachers</p>
                    <p className="text-2xl font-bold">{classItem.teachers.length}</p>
                    <p className="text-xs text-gray-500">Assigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Exams</p>
                    <p className="text-2xl font-bold">{classItem.examCount}</p>
                    <p className="text-xs text-gray-500">Created</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Class Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Academic Year</label>
                  <p className="text-sm">{classItem.academicYear}</p>
                </div>
                
                {classItem.room && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Room/Location</label>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{classItem.room}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Max Students</label>
                  <p className="text-sm">{classItem.maxStudents}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{new Date(classItem.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {classItem.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-700">{classItem.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Teachers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              {classItem.teachers.length === 0 ? (
                <p className="text-sm text-gray-500">No teachers assigned to this class yet.</p>
              ) : (
                <div className="space-y-3">
                  {classItem.teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{teacher.name}</h4>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        <p className="text-xs text-gray-500">ID: {teacher.employeeId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
      
      {/* Edit Class Modal */}
      <EditClassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onClassUpdated={onClassUpdate}
        classItem={classItem}
        teachers={teachers}
      />
    </Sheet>
  )
}
