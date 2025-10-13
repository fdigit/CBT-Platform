'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getGradeColor } from '@/lib/grading';

interface AcademicResultRow {
  id: string;
  subject: string;
  subjectCode?: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  actualGrade: string;
  targetedGrade?: string;
  gradePoint: number;
  remark?: string;
  scoresObtainable: number;
  scoresObtained: number;
  average?: number;
  teacher?: string;
}

interface AcademicResultsTableProps {
  results: AcademicResultRow[];
}

export function AcademicResultsTable({ results }: AcademicResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No academic results available</p>
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
              <TableHead>Subject</TableHead>
              <TableHead className="text-center">CA (40)</TableHead>
              <TableHead className="text-center">Exam (60)</TableHead>
              <TableHead className="text-center">Total (100)</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              {results.some(r => r.targetedGrade) && (
                <TableHead className="text-center">Target</TableHead>
              )}
              <TableHead className="text-center">GP</TableHead>
              <TableHead>Remark</TableHead>
              {results.some(r => r.average) && (
                <TableHead className="text-center">Class Avg</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map(result => (
              <TableRow key={result.id}>
                <TableCell className="font-medium">
                  {result.subject}
                  {result.subjectCode && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({result.subjectCode})
                    </span>
                  )}
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
                {results.some(r => r.targetedGrade) && (
                  <TableCell className="text-center text-sm text-gray-600">
                    {result.targetedGrade || '-'}
                  </TableCell>
                )}
                <TableCell className="text-center font-medium">
                  {result.gradePoint.toFixed(1)}
                </TableCell>
                <TableCell className="text-sm">
                  {result.remark || '-'}
                </TableCell>
                {results.some(r => r.average) && (
                  <TableCell className="text-center text-sm text-gray-600">
                    {result.average?.toFixed(1) || '-'}
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
                  {result.subject}
                </h3>
                {result.subjectCode && (
                  <p className="text-xs text-gray-500">
                    ({result.subjectCode})
                  </p>
                )}
              </div>
              <Badge className={getGradeColor(result.actualGrade)}>
                {result.actualGrade}
              </Badge>
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

            {(result.remark || result.targetedGrade || result.average) && (
              <div className="pt-2 border-t space-y-1 text-xs">
                {result.remark && (
                  <p className="text-gray-600">
                    <span className="font-medium">Remark:</span> {result.remark}
                  </p>
                )}
                {result.targetedGrade && (
                  <p className="text-gray-600">
                    <span className="font-medium">Target:</span>{' '}
                    {result.targetedGrade}
                  </p>
                )}
                {result.average && (
                  <p className="text-gray-600">
                    <span className="font-medium">Class Avg:</span>{' '}
                    {result.average.toFixed(1)}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
