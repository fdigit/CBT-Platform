'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ExamStatusBadge } from './ExamStatusBadge'
import { ExamTypeBadge } from './ExamTypeBadge'
import { ExamActionsDropdown } from './ExamActionsDropdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ExamTableProps {
  exams: Array<{
    id: string
    title: string
    description?: string
    school: {
      id: string
      name: string
      status: string
    }
    startTime: string
    endTime: string
    duration: number
    examStatus: string
    examType: string
    registeredStudents: number
    totalQuestions: number
    totalPoints: number
    createdAt: string
  }>
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
  onPageChange: (page: number) => void
  onExamUpdated: () => void
  onBulkAction: (examIds: string[], action: string, reason?: string) => void
  loading?: boolean
  className?: string
}

export function ExamTable({
  exams,
  pagination,
  onPageChange,
  onExamUpdated,
  onBulkAction,
  loading = false,
  className
}: ExamTableProps) {
  const [selectedExams, setSelectedExams] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExams(exams.map(exam => exam.id))
    } else {
      setSelectedExams([])
    }
  }

  const handleSelectExam = (examId: string, checked: boolean) => {
    if (checked) {
      setSelectedExams(prev => [...prev, examId])
    } else {
      setSelectedExams(prev => prev.filter(id => id !== examId))
    }
  }

  const handleBulkApprove = () => {
    if (selectedExams.length > 0) {
      onBulkAction(selectedExams, 'approve')
      setSelectedExams([])
    }
  }

  const handleBulkReject = () => {
    if (selectedExams.length > 0) {
      const reason = prompt('Please provide a reason for rejection:')
      if (reason) {
        onBulkAction(selectedExams, 'reject', reason)
        setSelectedExams([])
      }
    }
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading exams...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Exams ({pagination.totalCount})</CardTitle>
          {selectedExams.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedExams.length} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkApprove}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkReject}
                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
              >
                Reject Selected
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedExams.length === exams.length && exams.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Exam Details</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Type & Status</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Calendar className="h-8 w-8 mb-2" />
                      <p>No exams found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedExams.includes(exam.id)}
                        onCheckedChange={(checked) => handleSelectExam(exam.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900 line-clamp-1">
                          {exam.title}
                        </div>
                        {exam.description && (
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {exam.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Created {format(new Date(exam.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {exam.school.name}
                        </div>
                        <div className={cn(
                          'text-xs px-2 py-1 rounded-full inline-block',
                          exam.school.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        )}>
                          {exam.school.status}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDateTime(exam.startTime)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDuration(exam.duration)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Ends: {formatDateTime(exam.endTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <ExamTypeBadge type={exam.examType as any} />
                        <ExamStatusBadge status={exam.examStatus as any} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="font-medium">{exam.registeredStudents}</span>
                        <span className="text-gray-500 ml-1">registered</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{exam.totalQuestions} questions</div>
                        <div className="text-gray-500">{exam.totalPoints} points</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ExamActionsDropdown
                        exam={exam}
                        onExamUpdated={onExamUpdated}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing page {pagination.currentPage} of {pagination.totalPages} 
              ({pagination.totalCount} total exams)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
