'use client'

import { useState } from 'react'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { Search, MoreHorizontal, Trash2, UserCheck } from 'lucide-react'
import { useToast } from '../../../hooks/use-toast'

interface TeacherSubjectAssignment {
  id: string
  teacher: {
    id: string
    name: string
    email: string
    employeeId: string
  }
  subject: {
    id: string
    name: string
    code?: string
  }
  createdAt: string
}

interface TeacherSubjectsTableProps {
  assignments: TeacherSubjectAssignment[]
  loading: boolean
  onRefresh: () => void
}

export function TeacherSubjectsTable({
  assignments,
  loading,
  onRefresh
}: TeacherSubjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredAssignments = assignments.filter(assignment =>
    assignment.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRemoveAssignment = async (assignment: TeacherSubjectAssignment) => {
    if (!confirm(`Remove ${assignment.teacher.name} from ${assignment.subject.name}?`)) {
      return
    }

    setRemovingId(assignment.id)

    try {
      const response = await fetch('/api/school/subjects/assign-teachers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectId: assignment.subject.id,
          teacherId: assignment.teacher.id
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to remove assignment')
      }

      toast({
        title: 'Success',
        description: 'Teacher assignment removed successfully'
      })

      onRefresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove assignment',
        variant: 'destructive'
      })
    } finally {
      setRemovingId(null)
    }
  }

  // Group assignments by subject
  const groupedAssignments = filteredAssignments.reduce((acc, assignment) => {
    const subjectId = assignment.subject.id
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subject: assignment.subject,
        teachers: []
      }
    }
    acc[subjectId].teachers.push(assignment)
    return acc
  }, {} as Record<string, { subject: any; teachers: TeacherSubjectAssignment[] }>)

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Teacher ↔ Subject Assignments
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} total
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {Object.keys(groupedAssignments).length === 0 ? (
        <div className="text-center py-8">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchTerm ? 'No assignments found matching your search' : 'No teacher assignments yet'}
          </p>
          {!searchTerm && (
            <p className="text-gray-400 text-sm">
              Assign teachers to subjects to get started
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedAssignments).map(({ subject, teachers }) => (
            <div key={subject.id} className="border rounded-lg p-4">
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  {subject.code && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {subject.code}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {assignment.teacher.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {assignment.teacher.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {assignment.teacher.employeeId}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={removingId === assignment.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleRemoveAssignment(assignment)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Assignment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
