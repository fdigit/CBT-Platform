'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
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
import { 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  Edit, 
  Trash2,
  Building,
  Users,
  GraduationCap
} from 'lucide-react'
import { useToast } from '../../hooks/use-toast'

interface School {
  id: string
  name: string
  email: string
  phone?: string
  logoUrl?: string
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  admins: Array<{
    user: {
      id: string
      name: string
      email: string
    }
  }>
  _count: {
    students: number
    exams: number
    users: number
  }
}

interface SchoolManagementTableProps {
  schools: School[]
  onSchoolUpdate: (schoolId: string, updates: Partial<School>) => void
  onSchoolDelete: (schoolId: string) => void
}

export function SchoolManagementTable({ 
  schools, 
  onSchoolUpdate, 
  onSchoolDelete 
}: SchoolManagementTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    school: School | null
  }>({ open: false, school: null })
  const { toast } = useToast()

  const getStatusBadge = (status: School['status']) => {
    const variants = {
      PENDING: { variant: 'secondary' as const, label: 'Pending' },
      APPROVED: { variant: 'default' as const, label: 'Active' },
      SUSPENDED: { variant: 'destructive' as const, label: 'Suspended' },
      REJECTED: { variant: 'outline' as const, label: 'Rejected' }
    }
    
    const { variant, label } = variants[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  const handleAction = async (action: string, school: School) => {
    try {
      const response = await fetch('/api/schools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId: school.id, 
          action 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update school')
      }

      const updatedSchool = await response.json()
      onSchoolUpdate(school.id, updatedSchool)

      const actionLabels = {
        approve: 'approved',
        reject: 'rejected',
        suspend: 'suspended',
        reactivate: 'reactivated'
      }

      toast({
        title: 'Success',
        description: `School ${actionLabels[action as keyof typeof actionLabels]} successfully`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update school status',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.school) return

    try {
      const response = await fetch(`/api/schools?id=${deleteDialog.school.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete school')
      }

      onSchoolDelete(deleteDialog.school.id)
      setDeleteDialog({ open: false, school: null })

      toast({
        title: 'Success',
        description: 'School deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete school',
        variant: 'destructive'
      })
    }
  }

  const getSchoolInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Logo</TableHead>
              <TableHead>School Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Exams</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={school.logoUrl} alt={school.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getSchoolInitials(school.name)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{school.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {school.id.slice(0, 8)}...
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{school.email}</div>
                  {school.phone && (
                    <div className="text-sm text-muted-foreground">{school.phone}</div>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(school.status)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(school.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(school.createdAt).toLocaleTimeString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{school._count.students}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{school._count.users}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{school._count.exams}</span>
                  </div>
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
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      
                      {school.status === 'PENDING' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleAction('approve', school)}
                            className="text-green-600"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction('reject', school)}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {school.status === 'APPROVED' && (
                        <DropdownMenuItem
                          onClick={() => handleAction('suspend', school)}
                          className="text-orange-600"
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                      
                      {school.status === 'SUSPENDED' && (
                        <DropdownMenuItem
                          onClick={() => handleAction('reactivate', school)}
                          className="text-green-600"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteDialog({ open: true, school })}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => 
        setDeleteDialog({ open, school: deleteDialog.school })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <strong>{deleteDialog.school?.name}</strong> and all associated data.
              {deleteDialog.school && deleteDialog.school._count.students > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <strong>Warning:</strong> This school has {deleteDialog.school._count.students} students.
                  Deleting it will affect their accounts.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete School
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

