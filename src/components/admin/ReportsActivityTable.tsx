'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  User, 
  School, 
  BookOpen, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react'
import { format } from 'date-fns'

interface Activity {
  id: string
  type: 'user_registration' | 'school_approval' | 'exam_created' | 'payment_success' | 'exam_completed'
  title: string
  description: string
  user?: {
    name: string
    email: string
    role: string
  }
  school?: {
    name: string
  }
  metadata?: {
    [key: string]: any
  }
  createdAt: string
  status?: 'success' | 'pending' | 'failed' | 'warning'
}

interface ReportsActivityTableProps {
  activities: Activity[]
  loading?: boolean
  title?: string
  description?: string
  showViewAll?: boolean
  onViewAll?: () => void
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'user_registration':
      return <User className="h-4 w-4" />
    case 'school_approval':
      return <School className="h-4 w-4" />
    case 'exam_created':
      return <BookOpen className="h-4 w-4" />
    case 'payment_success':
      return <CreditCard className="h-4 w-4" />
    case 'exam_completed':
      return <CheckCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'user_registration':
      return 'bg-blue-100 text-blue-600'
    case 'school_approval':
      return 'bg-green-100 text-green-600'
    case 'exam_created':
      return 'bg-orange-100 text-orange-600'
    case 'payment_success':
      return 'bg-emerald-100 text-emerald-600'
    case 'exam_completed':
      return 'bg-purple-100 text-purple-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const getStatusBadge = (status?: Activity['status']) => {
  if (!status) return null

  const variants = {
    success: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    warning: 'bg-orange-100 text-orange-800'
  }

  const icons = {
    success: <CheckCircle className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    warning: <AlertCircle className="h-3 w-3" />
  }

  return (
    <Badge variant="outline" className={`${variants[status]} border-0 flex items-center gap-1`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export function ReportsActivityTable({ 
  activities, 
  loading, 
  title = "Recent Activity", 
  description = "Latest platform activities and events",
  showViewAll = true,
  onViewAll
}: ReportsActivityTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activities found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showViewAll && onViewAll && (
            <Button variant="outline" size="sm" onClick={onViewAll}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              {/* Activity Icon */}
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.description}
                    </p>
                    
                    {/* Additional Info */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {activity.user && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.user.name}
                        </span>
                      )}
                      {activity.school && (
                        <span className="flex items-center gap-1">
                          <School className="h-3 w-3" />
                          {activity.school.name}
                        </span>
                      )}
                      <span>{format(new Date(activity.createdAt), 'MMM dd, HH:mm')}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 ml-4">
                    {getStatusBadge(activity.status)}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {activities.length > 10 && showViewAll && onViewAll && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={onViewAll}>
              View All {activities.length} Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Alternative table view for detailed activities
export function DetailedActivityTable({ 
  activities, 
  loading, 
  title = "Activity Log", 
  description = "Detailed activity log with full information" 
}: ReportsActivityTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>User/School</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {activity.user && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`/avatars/${activity.user.name.charAt(0).toLowerCase()}.png`} />
                          <AvatarFallback className="text-xs">
                            {activity.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{activity.user.name}</p>
                          <p className="text-xs text-gray-500">{activity.user.role}</p>
                        </div>
                      </div>
                    )}
                    {activity.school && !activity.user && (
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{activity.school.name}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(activity.status)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
