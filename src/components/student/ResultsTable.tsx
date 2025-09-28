'use client';

import { Download, Eye, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface Result {
  id: string;
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  examDate: string;
  gradedAt: string;
  teacherRemark: string;
  teacher: string;
  passed: boolean;
}

interface ResultsTableProps {
  results: Result[];
  showActions?: boolean;
  limit?: number;
  className?: string;
  onViewDetails?: (resultId: string) => void;
  onDownloadPDF?: (resultId: string) => void;
}

export function ResultsTable({
  results,
  showActions = true,
  limit,
  className,
  onViewDetails,
  onDownloadPDF,
}: ResultsTableProps) {
  const displayResults = limit ? results.slice(0, limit) : results;

  const getGradeBadge = (grade: string, passed: boolean) => {
    const baseClasses = 'font-medium';

    if (passed) {
      return (
        <Badge className={`bg-green-100 text-green-800 ${baseClasses}`}>
          {grade}
        </Badge>
      );
    } else {
      return (
        <Badge className={`bg-red-100 text-red-800 ${baseClasses}`}>
          {grade}
        </Badge>
      );
    }
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 70) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
  };

  if (displayResults.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No exam results available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Date</TableHead>
              {showActions && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayResults.map(result => (
              <TableRow key={result.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    {getPerformanceIcon(result.percentage)}
                    <span>{result.examTitle}</span>
                  </div>
                </TableCell>
                <TableCell>{result.subject}</TableCell>
                <TableCell>
                  <span className="font-mono">
                    {result.score}/{result.totalMarks}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-semibold ${
                        result.percentage >= 70
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {result.percentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getGradeBadge(result.grade, result.passed)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(result.examDate).toLocaleDateString()}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onViewDetails && onViewDetails(result.id)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onDownloadPDF && onDownloadPDF(result.id)
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
