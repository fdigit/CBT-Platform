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
    <div className="overflow-x-auto">
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
              <TableCell className="text-sm">{result.remark || '-'}</TableCell>
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
  );
}
