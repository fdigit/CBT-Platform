'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getGradeColor } from '@/lib/grading';
import { Edit, Trash2 } from 'lucide-react';

interface ResultRow {
  id: string;
  studentName: string;
  regNumber: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  actualGrade: string;
  gradePoint: number;
  remark?: string;
  status: string;
  teacherComment?: string;
}

interface ResultsTableProps {
  results: ResultRow[];
  onEdit?: (result: ResultRow) => void;
  onDelete?: (resultId: string) => void;
  showActions?: boolean;
}

export function ResultsTable({
  results,
  onEdit,
  onDelete,
  showActions = true,
}: ResultsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="bg-gray-100">
            Draft
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Submitted</Badge>
        );
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'PUBLISHED':
        return <Badge className="bg-blue-100 text-blue-800">Published</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Reg Number</TableHead>
              <TableHead className="text-center">CA (40)</TableHead>
              <TableHead className="text-center">Exam (60)</TableHead>
              <TableHead className="text-center">Total (100)</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead className="text-center">GP</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Status</TableHead>
              {showActions && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map(result => (
              <TableRow key={result.id}>
                <TableCell className="font-medium">
                  {result.studentName}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {result.regNumber}
                </TableCell>
                <TableCell className="text-center">
                  {result.caScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-center">
                  {result.examScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {result.totalScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={getGradeColor(result.actualGrade)}>
                    {result.actualGrade}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {result.gradePoint.toFixed(1)}
                </TableCell>
                <TableCell className="text-sm">
                  {result.remark || '-'}
                </TableCell>
                <TableCell>{getStatusBadge(result.status)}</TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {(result.status === 'DRAFT' ||
                        result.status === 'REJECTED') && (
                        <>
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(result)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(result.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {results.map(result => (
          <div
            key={result.id}
            className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm break-words">
                  {result.studentName}
                </h3>
                <p className="text-xs text-gray-500">{result.regNumber}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={getGradeColor(result.actualGrade)}>
                  {result.actualGrade}
                </Badge>
                {getStatusBadge(result.status)}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">CA</p>
                <p className="font-semibold">{result.caScore.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Exam</p>
                <p className="font-semibold">{result.examScore.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-semibold text-blue-600">
                  {result.totalScore.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">GP</p>
                <p className="font-semibold">{result.gradePoint.toFixed(1)}</p>
              </div>
            </div>

            {result.remark && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">Remark</p>
                <p className="text-sm text-gray-700">{result.remark}</p>
              </div>
            )}

            {showActions &&
              (result.status === 'DRAFT' || result.status === 'REJECTED') && (
                <div className="flex gap-2 pt-2 border-t">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEdit(result)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(result.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
          </div>
        ))}
      </div>
    </>
  );
}
