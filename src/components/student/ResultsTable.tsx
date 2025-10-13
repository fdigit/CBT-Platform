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
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">Recent Results</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {displayResults.map(result => (
            <div
              key={result.id}
              className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getPerformanceIcon(result.percentage)}
                    <h3 className="font-semibold text-gray-900 text-sm break-words">
                      {result.examTitle}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500">{result.subject}</p>
                </div>
                {getGradeBadge(result.grade, result.passed)}
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="font-mono font-medium">
                    {result.score}/{result.totalMarks}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Percentage</p>
                  <p
                    className={`font-semibold ${
                      result.percentage >= 70
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {result.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-xs font-medium">
                    {new Date(result.examDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {showActions && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewDetails && onViewDetails(result.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onDownloadPDF && onDownloadPDF(result.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
