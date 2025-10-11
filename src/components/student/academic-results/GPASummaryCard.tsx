'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Award, Target, TrendingUp } from 'lucide-react';

interface GPASummaryCardProps {
  gpa: number;
  totalGradePoints: number;
  numberOfSubjects: number;
  overallGrade: string;
  classAverage?: number;
}

export function GPASummaryCard({
  gpa,
  totalGradePoints,
  numberOfSubjects,
  overallGrade,
  classAverage,
}: GPASummaryCardProps) {
  const getGradeColor = (grade: string) => {
    if (grade === 'A*' || grade === 'A') return 'text-green-600';
    if (grade === 'B+' || grade === 'B') return 'text-blue-600';
    if (grade === 'C') return 'text-yellow-600';
    if (grade === 'D') return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (gpa: number) => {
    if (gpa >= 4.5) return 'Outstanding performance!';
    if (gpa >= 4.0) return 'Very good performance!';
    if (gpa >= 3.5) return 'Good performance.';
    if (gpa >= 3.0) return 'Fair performance.';
    if (gpa >= 2.0) return 'Below average.';
    return 'Needs improvement.';
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2 text-blue-600" />
          Grade Point Average (GPA)
        </CardTitle>
        <CardDescription>Your overall academic performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getGradeColor(overallGrade)}`}>
            {gpa.toFixed(2)}
          </div>
          <p className="text-lg font-medium text-gray-700 mt-2">
            Overall Grade:{' '}
            <span className={getGradeColor(overallGrade)}>{overallGrade}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {getPerformanceMessage(gpa)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">
              Total Grade Points
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {totalGradePoints.toFixed(1)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">Subjects</p>
            <p className="text-2xl font-bold text-gray-900">
              {numberOfSubjects}
            </p>
          </div>
        </div>

        {classAverage && (
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500 mb-2">
              Compared to Class Average
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Your GPA</p>
                <p className="text-lg font-bold text-blue-600">
                  {gpa.toFixed(2)}
                </p>
              </div>
              <div className="text-2xl text-gray-400">vs</div>
              <div>
                <p className="text-xs text-gray-600">Class Average</p>
                <p className="text-lg font-bold text-gray-700">
                  {classAverage.toFixed(2)}
                </p>
              </div>
            </div>
            {gpa > classAverage ? (
              <p className="text-sm text-green-600 mt-2 text-center">
                ↑ Above class average by {(gpa - classAverage).toFixed(2)}{' '}
                points
              </p>
            ) : gpa < classAverage ? (
              <p className="text-sm text-orange-600 mt-2 text-center">
                ↓ Below class average by {(classAverage - gpa).toFixed(2)}{' '}
                points
              </p>
            ) : (
              <p className="text-sm text-blue-600 mt-2 text-center">
                = Exactly at class average
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
