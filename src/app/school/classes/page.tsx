'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SchoolDashboardLayout } from '@/components/school/SchoolDashboardLayout'
import { ClassesHeader } from '@/components/school/classes/ClassesHeader'
import { ClassesFilters } from '@/components/school/classes/ClassesFilters'
import { ClassesTable } from '@/components/school/classes/ClassesTable'
import { ClassesAnalytics } from '@/components/school/classes/ClassesAnalytics'
import { ClassProfileDrawer } from '@/components/school/classes/ClassProfileDrawer'
import { AddClassModal } from '@/components/school/classes/AddClassModal'
import { useToast } from '@/hooks/use-toast'

export interface Class {
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

export interface Teacher {
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
    academicYear: string
    displayName: string
  }>
}

export interface ClassesFilters {
  search: string
  academicYear: string
  status: string
}

export default function ClassesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<ClassesFilters>({
    search: '',
    academicYear: '',
    status: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchClasses()
    fetchTeachers()
  }, [session, status, router, filters, pagination.page])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })

      const response = await fetch(`/api/school/classes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages
        }))
      } else {
        throw new Error('Failed to fetch classes')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch classes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/school/teachers?limit=100')
      if (response.ok) {
        const data = await response.json()
        setTeachers(data.teachers)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const handleClassClick = (classItem: Class) => {
    setSelectedClass(classItem)
    setIsProfileDrawerOpen(true)
  }

  const handleClassUpdate = (updatedClass: Class) => {
    setClasses(prev => 
      prev.map(c => c.id === updatedClass.id ? updatedClass : c)
    )
    setSelectedClass(updatedClass)
  }

  const handleClassAdd = (newClass: Class) => {
    setClasses(prev => [newClass, ...prev])
    fetchClasses() // Refresh to get updated pagination
  }

  const handleFiltersChange = (newFilters: Partial<ClassesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handleClassDelete = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId))
    if (selectedClass?.id === classId) {
      setSelectedClass(null)
      setIsProfileDrawerOpen(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <SchoolDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading classes...</p>
          </div>
        </div>
      </SchoolDashboardLayout>
    )
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Analytics Widgets */}
        <ClassesAnalytics classes={classes} teachers={teachers} />

        {/* Header with Action Buttons */}
        <ClassesHeader 
          onAddClass={() => setIsAddModalOpen(true)}
          onExport={() => {/* TODO: Implement export */}}
        />

        {/* Search & Filter Panel */}
        <ClassesFilters 
          filters={filters}
          onChange={handleFiltersChange}
        />

        {/* Classes Table */}
        <ClassesTable 
          classes={classes}
          loading={loading}
          onClassClick={handleClassClick}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onClassUpdate={handleClassUpdate}
          onClassDelete={handleClassDelete}
        />

        {/* Modals and Drawers */}
        <AddClassModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onClassAdded={handleClassAdd}
          teachers={teachers}
        />

        <ClassProfileDrawer 
          classItem={selectedClass}
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          onClassUpdate={handleClassUpdate}
          teachers={teachers}
        />
      </div>
    </SchoolDashboardLayout>
  )
}
