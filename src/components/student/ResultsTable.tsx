'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Download, Eye, TrendingUp, TrendingDown } from 'lucide-react';

interface Result {
  id: string;
  examTitle: string;
  subject: string;
  score: number;
  totalPoints: number;
  percentage: number;
  grade: string;
  date: string;
  duration: number;
  status: 'passed' | 'failed';
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

  const getGradeBadge = (grade: string, status: 'passed' | 'failed') => {
    const baseClasses = 'font-medium';

    if (status === 'passed') {
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
                    {result.score}/{result.totalPoints}
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
                  {getGradeBadge(result.grade, result.status)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(result.date).toLocaleDateString()}
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
