'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Users, GraduationCap, BookOpen, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
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
import { useMemo } from 'react'

interface ClassesAnalyticsProps {
  classes: Class[]
  teachers: Teacher[]
}

export function ClassesAnalytics({ classes, teachers }: ClassesAnalyticsProps) {
  const analytics = useMemo(() => {
    const total = classes.length
    const active = classes.filter(c => c.status === 'ACTIVE').length
    const inactive = classes.filter(c => c.status === 'INACTIVE').length
    const archived = classes.filter(c => c.status === 'ARCHIVED').length
    
    // Academic year distribution
    const academicYears = classes.reduce((acc, cls) => {
      acc[cls.academicYear] = (acc[cls.academicYear] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Current academic year (most common)
    const currentYear = Object.entries(academicYears)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
    
    // Student distribution
    const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0)
    const averageStudentsPerClass = total > 0 ? Math.round(totalStudents / total) : 0
    
    // Class capacity analysis
    const capacityUsage = classes.map(cls => ({
      id: cls.id,
      name: `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`,
      usage: cls.maxStudents > 0 ? (cls.studentCount / cls.maxStudents) * 100 : 0,
      students: cls.studentCount,
      maxStudents: cls.maxStudents
    })).sort((a, b) => b.usage - a.usage)
    
    const overCapacity = capacityUsage.filter(c => c.usage > 100).length
    const nearCapacity = capacityUsage.filter(c => c.usage >= 80 && c.usage <= 100).length
    
    // Teacher distribution
    const totalTeachers = teachers.length
    const activeTeachers = teachers.filter(t => t.status === 'ACTIVE').length
    const unassignedTeachers = teachers.filter(t => t.classCount === 0).length
    const teachersWithMultipleClasses = teachers.filter(t => t.classCount > 1).length
    
    // Classes without teachers
    const classesWithoutTeachers = classes.filter(c => c.teachers.length === 0).length
    
    return {
      total,
      active,
      inactive,
      archived,
      academicYears,
      currentYear,
      totalStudents,
      averageStudentsPerClass,
      capacityUsage: capacityUsage.slice(0, 5), // Top 5
      overCapacity,
      nearCapacity,
      totalTeachers,
      activeTeachers,
      unassignedTeachers,
      teachersWithMultipleClasses,
      classesWithoutTeachers
    }
  }, [classes, teachers])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCapacityColor = (usage: number) => {
    if (usage > 100) return 'text-red-600'
    if (usage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Classes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.active} active • {analytics.currentYear}
          </p>
        </CardContent>
      </Card>

      {/* Total Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{analytics.totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            Avg {analytics.averageStudentsPerClass} per class
          </p>
        </CardContent>
      </Card>

      {/* Active Teachers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
          <GraduationCap className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{analytics.activeTeachers}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.unassignedTeachers} unassigned
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attention Needed</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {analytics.overCapacity + analytics.classesWithoutTeachers}
          </div>
          <p className="text-xs text-muted-foreground">
            Over capacity + No teachers
          </p>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Class Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor('ACTIVE')}>
              Active: {analytics.active}
            </Badge>
            {analytics.inactive > 0 && (
              <Badge className={getStatusColor('INACTIVE')}>
                Inactive: {analytics.inactive}
              </Badge>
            )}
            {analytics.archived > 0 && (
              <Badge className={getStatusColor('ARCHIVED')}>
                Archived: {analytics.archived}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Years */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Academic Years</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(analytics.academicYears)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([year, count]) => (
                <div key={year} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{year}</span>
                  <Badge variant="outline">{count} classes</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Capacity Usage */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Class Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.capacityUsage.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate mr-2">{cls.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {cls.students}/{cls.maxStudents}
                  </span>
                  <span className={`text-sm font-bold ${getCapacityColor(cls.usage)}`}>
                    {Math.round(cls.usage)}%
                  </span>
                </div>
              </div>
            ))}
            {analytics.capacityUsage.length === 0 && (
              <p className="text-sm text-muted-foreground">No classes available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teacher Insights */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Teacher Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Teachers</span>
              <Badge variant="outline">{analytics.totalTeachers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Teachers</span>
              <Badge className="bg-green-100 text-green-800">{analytics.activeTeachers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Unassigned</span>
              <Badge className="bg-yellow-100 text-yellow-800">{analytics.unassignedTeachers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Multiple Classes</span>
              <Badge variant="outline">{analytics.teachersWithMultipleClasses}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Classes w/o Teachers</span>
              <Badge className="bg-red-100 text-red-800">{analytics.classesWithoutTeachers}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
