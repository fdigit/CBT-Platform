'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreHorizontal, Edit, Trash2, Users, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Subject {
  id: string
  name: string
  code?: string
  description?: string
  status: string
  createdAt: string
  _count: {
    teachers: number
    classSubjects: number
  }
}

interface SubjectsTableProps {
  subjects: Subject[]
  loading: boolean
  onSubjectUpdate: (subject: Subject) => void
  onSubjectDelete: (subjectId: string) => void
  onRefresh: () => void
}

export function SubjectsTable({
  subjects,
  loading,
  onSubjectUpdate,
  onSubjectDelete,
  onRefresh
}: SubjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (subject: Subject) => {
    if (subject._count.teachers > 0 || subject._count.classSubjects > 0) {
      toast({
        title: 'Cannot Delete Subject',
        description: 'This subject has active assignments. Remove all assignments before deleting.',
        variant: 'destructive'
      })
      return
    }

    if (!confirm(`Are you sure you want to delete "${subject.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(subject.id)

    try {
      const response = await fetch(`/api/school/subjects/${subject.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to delete subject')
      }

      toast({
        title: 'Success',
        description: 'Subject deleted successfully'
      })

      onSubjectDelete(subject.id)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete subject',
        variant: 'destructive'
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>
      case 'ARCHIVED':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

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
            <h2 className="text-xl font-semibold text-gray-900">Subjects</h2>
            <p className="text-gray-600 text-sm mt-1">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''} total
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchTerm ? 'No subjects found matching your search' : 'No subjects created yet'}
          </p>
          {!searchTerm && (
            <p className="text-gray-400 text-sm">
              Create your first subject to get started
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Teachers</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">
                    {subject.name}
                  </TableCell>
                  <TableCell>
                    {subject.code ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        {subject.code}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {subject.description ? (
                        <p className="text-sm text-gray-600 truncate" title={subject.description}>
                          {subject.description}
                        </p>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(subject.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{subject._count.teachers}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{subject._count.classSubjects}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={deletingId === subject.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onSubjectUpdate(subject)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(subject)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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
      )}
    </Card>
  )
}
