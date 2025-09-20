'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Trash2
} from 'lucide-react'
import { useState } from 'react'

interface StudentsHeaderProps {
  onAddStudent: () => void
  onBulkUpload: () => void
  onExport: () => void
  selectedCount: number
  onBulkAction: (action: string, studentIds: string[]) => Promise<void>
  selectedStudents: string[]
}

export function StudentsHeader({ 
  onAddStudent, 
  onBulkUpload, 
  onExport, 
  selectedCount,
  onBulkAction,
  selectedStudents
}: StudentsHeaderProps) {
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  const handleBulkAction = async (action: string) => {
    setIsPerformingAction(true)
    try {
      await onBulkAction(action, selectedStudents)
    } finally {
      setIsPerformingAction(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-600">
            Manage your school's student records and information
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={onExport} 
            variant="outline" 
            size="sm"
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            onClick={onBulkUpload} 
            variant="outline" 
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          
          <Button 
            onClick={onAddStudent}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedCount} selected
              </Badge>
              <span className="text-sm text-gray-600">
                Bulk actions available
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('activate')}
                disabled={isPerformingAction}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('suspend')}
                disabled={isPerformingAction}
              >
                <UserX className="h-4 w-4 mr-2" />
                Suspend
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('graduate')}
                disabled={isPerformingAction}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Graduate
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleBulkAction('promote')}
                    disabled={isPerformingAction}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Promote Class
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={onExport}
                    disabled={isPerformingAction}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Students</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedCount} selected students? 
                          This action cannot be undone and will also delete all their exam records and results.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleBulkAction('delete')}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isPerformingAction}
                        >
                          Delete {selectedCount} Students
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Export Button */}
      <div className="sm:hidden">
        <Button 
          onClick={onExport} 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Students
        </Button>
      </div>
    </div>
  )
}
