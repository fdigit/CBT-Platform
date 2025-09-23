'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Checkbox } from '../ui/checkbox'
import {
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Key,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'

export interface User {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'STUDENT'
  school?: {
    id: string
    name: string
    status: string
  } | null
  regNumber?: string
  createdAt: string
  updatedAt: string
  notificationCount: number
}

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onView: (user: User) => void
  onSuspend: (userId: string) => void
  onReactivate: (userId: string) => void
  onDelete: (userId: string) => void
  onResetPassword: (userId: string) => void
  selectedUsers: string[]
  onSelectionChange: (selectedUsers: string[]) => void
  loading?: boolean
}

export function UserTable({
  users,
  onEdit,
  onView,
  onSuspend,
  onReactivate,
  onDelete,
  onResetPassword,
  selectedUsers,
  onSelectionChange,
  loading = false,
}: UserTableProps) {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive'
      case 'SCHOOL_ADMIN':
        return 'default'
      case 'STUDENT':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleBadgeText = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin'
      case 'SCHOOL_ADMIN':
        return 'School Admin'
      case 'STUDENT':
        return 'Student'
      default:
        return role
    }
  }

  const getStatusBadgeVariant = (email: string, name: string) => {
    if (email.includes('.suspended.') || name.startsWith('[SUSPENDED]')) {
      return 'destructive'
    }
    if (email.includes('.deleted.') || name.startsWith('[DELETED]')) {
      return 'outline'
    }
    return 'secondary'
  }

  const getStatusBadgeText = (email: string, name: string) => {
    if (email.includes('.suspended.') || name.startsWith('[SUSPENDED]')) {
      return 'Suspended'
    }
    if (email.includes('.deleted.') || name.startsWith('[DELETED]')) {
      return 'Deleted'
    }
    return 'Active'
  }

  const isUserSuspended = (email: string, name: string) => {
    return email.includes('.suspended.') || name.startsWith('[SUSPENDED]')
  }

  const isUserDeleted = (email: string, name: string) => {
    return email.includes('.deleted.') || name.startsWith('[DELETED]')
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(users.map(user => user.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedUsers, userId])
    } else {
      onSelectionChange(selectedUsers.filter(id => id !== userId))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 animate-pulse rounded" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all users"
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>School</TableHead>
            <TableHead>Registration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                className={`transition-colors ${
                  selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                }`}
                onMouseEnter={() => setHoveredUser(user.id)}
                onMouseLeave={() => setHoveredUser(null)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => 
                      handleSelectUser(user.id, checked as boolean)
                    }
                    aria-label={`Select ${user.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                      {user.regNumber && (
                        <p className="text-xs text-gray-400">
                          Reg: {user.regNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleBadgeText(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.school ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.school.name}
                      </p>
                      <Badge 
                        variant={user.school.status === 'APPROVED' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {user.school.status}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No school</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.email, user.name)}>
                    {getStatusBadgeText(user.email, user.name)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {format(new Date(user.updatedAt), 'MMM dd, yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onView(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {isUserSuspended(user.email, user.name) ? (
                        <DropdownMenuItem onClick={() => onReactivate(user.id)}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Reactivate User
                        </DropdownMenuItem>
                      ) : !isUserDeleted(user.email, user.name) ? (
                        <DropdownMenuItem 
                          onClick={() => onSuspend(user.id)}
                          className="text-orange-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Suspend User
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem 
                        onClick={() => onResetPassword(user.id)}
                        className="text-blue-600"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(user.id)}
                        className="text-red-600"
                        disabled={isUserDeleted(user.email, user.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
