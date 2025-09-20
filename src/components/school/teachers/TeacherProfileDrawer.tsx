'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  Award,
  AlertTriangle,
  UserCheck,
  UserX,
  Key,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Teacher } from '@/app/school/teachers/page'
import { AssignClassesModal } from './AssignClassesModal'

interface TeacherProfileDrawerProps {
  teacher: Teacher | null
  isOpen: boolean
  onClose: () => void
  onTeacherUpdate: (teacher: Teacher) => void
}

export function TeacherProfileDrawer({ 
  teacher, 
  isOpen, 
  onClose, 
  onTeacherUpdate 
}: TeacherProfileDrawerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isAssignClassesModalOpen, setIsAssignClassesModalOpen] = useState(false)

  if (!teacher) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200'
      case 'ON_LEAVE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'SUSPENDED': return 'bg-red-100 text-red-800 border-red-200'
      case 'TERMINATED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active'
      case 'ON_LEAVE': return 'On Leave'
      case 'SUSPENDED': return 'Suspended'
      case 'TERMINATED': return 'Retired'
      default: return status
    }
  }

  const handleStatusToggle = async () => {
    const newStatus = teacher.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const updatedTeacher = { ...teacher, status: newStatus as any }
    onTeacherUpdate(updatedTeacher)
  }

  const handleResetPassword = async () => {
    // TODO: API call to reset password
    console.log('Reset password for teacher:', teacher.id)
  }

  // Mock performance data (in real app, this would come from API)
  const performanceData = {
    averageStudentScore: 78.5,
    classesManaged: teacher.classCount,
    studentsCount: 120, // Mock data
    attendanceRate: 95,
    lastLoginDays: teacher.lastLogin ? 
      Math.floor((new Date().getTime() - new Date(teacher.lastLogin).getTime()) / (1000 * 3600 * 24)) : 
      null,
    recentActivities: [
      { date: '2024-01-15', activity: 'Uploaded exam results for SS1 Mathematics' },
      { date: '2024-01-14', activity: 'Created new assignment for JSS3 Physics' },
      { date: '2024-01-12', activity: 'Attended staff meeting' },
    ]
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={teacher.avatar} alt={teacher.name} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold">{teacher.name}</SheetTitle>
              <SheetDescription className="text-base">
                {teacher.employeeId} • {teacher.specialization || 'Teacher'}
              </SheetDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={cn('border', getStatusColor(teacher.status))}
                >
                  {getStatusLabel(teacher.status)}
                </Badge>
                {teacher.experience && (
                  <Badge variant="secondary">
                    {teacher.experience} years experience
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{teacher.email}</p>
                    </div>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{teacher.phone}</p>
                      </div>
                    </div>
                  )}
                  {teacher.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{teacher.address}</p>
                      </div>
                    </div>
                  )}
                  {teacher.hireDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Hire Date</p>
                        <p className="font-medium">
                          {format(new Date(teacher.hireDate), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacher.qualification && (
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Qualification</p>
                        <p className="font-medium">{teacher.qualification}</p>
                      </div>
                    </div>
                  )}
                  {teacher.specialization && (
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Specialization</p>
                        <p className="font-medium">{teacher.specialization}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Classes Assigned</p>
                      <p className="font-medium">{teacher.classCount} classes</p>
                    </div>
                  </div>
                  {performanceData.lastLoginDays !== null && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="font-medium">
                          {performanceData.lastLoginDays === 0 ? 'Today' : 
                           performanceData.lastLoginDays === 1 ? 'Yesterday' :
                           `${performanceData.lastLoginDays} days ago`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{performanceData.studentsCount}</p>
                      <p className="text-sm text-gray-500">Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{performanceData.averageStudentScore}%</p>
                      <p className="text-sm text-gray-500">Avg. Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{performanceData.attendanceRate}%</p>
                      <p className="text-sm text-gray-500">Attendance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Classes</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.classes.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{cls.displayName}</p>
                          <p className="text-sm text-gray-500">Academic Year: {cls.academicYear}</p>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No classes assigned</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Student Average Score</span>
                      <span className="text-sm text-gray-500">{performanceData.averageStudentScore}%</span>
                    </div>
                    <Progress value={performanceData.averageStudentScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Attendance Rate</span>
                      <span className="text-sm text-gray-500">{performanceData.attendanceRate}%</span>
                    </div>
                    <Progress value={performanceData.attendanceRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.activity}</p>
                        <p className="text-xs text-gray-500">{format(new Date(activity.date), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Status</p>
                    <p className="text-sm text-gray-500">
                      {teacher.status === 'ACTIVE' ? 'Teacher account is active' : 'Teacher account is inactive'}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        {teacher.status === 'ACTIVE' ? (
                          <><UserX className="h-4 w-4 mr-2" />Suspend</>
                        ) : (
                          <><UserCheck className="h-4 w-4 mr-2" />Activate</>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {teacher.status === 'ACTIVE' ? 'Suspend Teacher' : 'Activate Teacher'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {teacher.status === 'ACTIVE' 
                            ? 'Are you sure you want to suspend this teacher? They will not be able to access the system.'
                            : 'Are you sure you want to activate this teacher? They will regain access to the system.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStatusToggle}>
                          {teacher.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reset Password</p>
                    <p className="text-sm text-gray-500">Generate a new password for this teacher</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Teacher Password</AlertDialogTitle>
                        <AlertDialogDescription>
                          A new temporary password will be generated and sent to the teacher's email address.
                          They will be required to change it on their next login.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetPassword}>
                          Reset Password
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Assign/Unassign Classes</p>
                    <p className="text-sm text-gray-500">Manage class assignments for this teacher</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAssignClassesModalOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Classes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
      
      {/* Assign Classes Modal */}
      <AssignClassesModal
        isOpen={isAssignClassesModalOpen}
        onClose={() => setIsAssignClassesModalOpen(false)}
        onTeacherUpdated={onTeacherUpdate}
        teacher={teacher}
      />
    </Sheet>
  )
}
