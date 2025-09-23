'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { Textarea } from '../ui/textarea'
import { User, School } from 'lucide-react'

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

interface EditUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<User>) => void
  schools: Array<{ id: string; name: string; status: string }>
  loading?: boolean
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
  schools,
  loading = false,
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'STUDENT',
    schoolId: user?.school?.id || '',
  })

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(formData)
  }

  const handleClose = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'STUDENT',
      schoolId: user?.school?.id || '',
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{user ? 'Edit User' : 'Add New User'}</span>
          </DialogTitle>
          <DialogDescription>
            {user 
              ? 'Update user information and permissions.'
              : 'Create a new user account.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => updateFormData('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="school">School (Optional)</Label>
            <Select
              value={formData.schoolId}
              onValueChange={(value) => updateFormData('schoolId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No School</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    <div className="flex items-center space-x-2">
                      <School className="h-4 w-4" />
                      <span>{school.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export function DeleteUserModal({
  user,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: DeleteUserModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{user?.name}</strong>?
            This action cannot be undone and will permanently remove the user account
            and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface ResetPasswordModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (newPassword: string) => void
  loading?: boolean
}

export function ResetPasswordModal({
  user,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')

  const handleConfirm = () => {
    if (newPassword.length >= 8) {
      onConfirm(newPassword)
      setNewPassword('')
    }
  }

  const handleClose = () => {
    setNewPassword('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for <strong>{user?.name}</strong>. 
            The user will need to change this password on their next login.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              minLength={8}
            />
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters long
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || newPassword.length < 8}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface BulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (action: string, message?: string) => void
  action: string
  selectedCount: number
  loading?: boolean
}

export function BulkActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  selectedCount,
  loading = false,
}: BulkActionModalProps) {
  const [message, setMessage] = useState('')

  const getActionTitle = () => {
    switch (action) {
      case 'suspend':
        return 'Suspend Users'
      case 'reactivate':
        return 'Reactivate Users'
      case 'delete':
        return 'Delete Users'
      case 'reset-password':
        return 'Reset Passwords'
      default:
        return 'Bulk Action'
    }
  }

  const getActionDescription = () => {
    switch (action) {
      case 'suspend':
        return `Are you sure you want to suspend ${selectedCount} user(s)? They will not be able to access the platform.`
      case 'reactivate':
        return `Are you sure you want to reactivate ${selectedCount} user(s)? They will regain access to the platform.`
      case 'delete':
        return `Are you sure you want to permanently delete ${selectedCount} user(s)? This action cannot be undone.`
      case 'reset-password':
        return `Are you sure you want to reset passwords for ${selectedCount} user(s)? They will receive new temporary passwords.`
      default:
        return `Are you sure you want to perform this action on ${selectedCount} user(s)?`
    }
  }

  const isDestructive = action === 'delete'

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getActionTitle()}</AlertDialogTitle>
          <AlertDialogDescription>
            {getActionDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {(action === 'suspend' || action === 'delete') && (
          <div className="py-4">
            <Label htmlFor="message">Reason (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter reason for this action..."
              rows={3}
            />
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(action, message)}
            disabled={loading}
            className={isDestructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {loading ? 'Processing...' : `Confirm ${getActionTitle()}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
