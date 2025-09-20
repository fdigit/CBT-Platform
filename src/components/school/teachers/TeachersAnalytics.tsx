'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle,
  GraduationCap,
  BookOpen,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { TeachersStats } from '@/app/school/teachers/page'

interface TeachersAnalyticsProps {
  stats: TeachersStats
}

export function TeachersAnalytics({ stats }: TeachersAnalyticsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'onLeave': return 'text-yellow-600 bg-yellow-50'
      case 'suspended': return 'text-red-600 bg-red-50'
      case 'retired': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const activePercentage = stats.total > 0 ? (stats.active / stats.total) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">All registered teachers</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress value={activePercentage} className="flex-1 h-2" />
              <span className="text-xs text-gray-500">{activePercentage.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">On Leave</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.onLeave}</div>
            <p className="text-xs text-gray-500 mt-1">Temporary absence</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            <p className="text-xs text-gray-500 mt-1">Disciplinary action</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Retired</CardTitle>
            <GraduationCap className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.retired}</div>
            <p className="text-xs text-gray-500 mt-1">No longer active</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teachers by Subject */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Teachers by Subject</CardTitle>
            <BookOpen className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.bySubject).slice(0, 6).map(([subject, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={subject} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{subject}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </div>
              )
            })}
            {Object.keys(stats.bySubject).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No subject data available</p>
            )}
          </CardContent>
        </Card>

        {/* Teachers by Role */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Teachers by Role</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">{role.replace('_', ' ')}</span>
                <Badge variant="secondary" className={getStatusColor(role.toLowerCase())}>
                  {count}
                </Badge>
              </div>
            ))}
            {Object.keys(stats.byRole).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No role data available</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Performance Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.performanceAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.teacherName}</p>
                    <p className="text-xs mt-1">{alert.description}</p>
                  </div>
                  <Badge variant="outline" className={`ml-2 ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
            {stats.performanceAlerts.length === 0 && (
              <div className="text-center py-4">
                <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All teachers performing well!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workload Distribution */}
      {stats.workloadDistribution.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Workload Distribution</CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.workloadDistribution.slice(0, 10).map((teacher, index) => {
                const maxWorkload = Math.max(...stats.workloadDistribution.map(t => t.workloadScore))
                const workloadPercentage = maxWorkload > 0 ? (teacher.workloadScore / maxWorkload) * 100 : 0
                const isOverloaded = teacher.workloadScore > 80
                
                return (
                  <div key={teacher.teacherId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{teacher.teacherName}</p>
                        <p className="text-xs text-gray-500">
                          {teacher.classCount} classes • {teacher.studentCount} students
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{teacher.workloadScore}%</span>
                        {isOverloaded && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={workloadPercentage} 
                      className={`h-2 ${isOverloaded ? 'bg-red-100' : ''}`}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
