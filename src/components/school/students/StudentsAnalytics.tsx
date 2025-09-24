'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Student } from '@/types/models';
import { useMemo } from 'react';

interface StudentsAnalyticsProps {
  students: Student[];
}

export function StudentsAnalytics({ students }: StudentsAnalyticsProps) {
  const analytics = useMemo(() => {
    const total = students.length;
    const active = students.length; // All students are considered active
    const suspended = 0; // No suspended students
    const graduated = 0; // No graduated students
    const pending = 0; // No pending students
    const alumni = 0; // No alumni students

    // Gender distribution
    const male = 0; // No gender data available
    const female = 0; // No gender data available
    const genderNotSpecified = total - male - female;

    // Class distribution
    const classDistribution = students.reduce(
      (acc, student) => {
        const className = 'Unassigned'; // All students are unassigned
        acc[className] = (acc[className] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Performance insights
    const studentsWithScores: Student[] = []; // No performance scores available
    const averagePerformance = 0; // No performance scores available

    const lowPerformers = 0; // No performance scores available
    const highPerformers = 0; // No performance scores available

    // Recent registrations (last 30 days)
    const recentRegistrations = 0; // No creation date data available

    return {
      total,
      active,
      suspended,
      graduated,
      pending,
      alumni,
      male,
      female,
      genderNotSpecified,
      classDistribution,
      averagePerformance,
      lowPerformers,
      highPerformers,
      recentRegistrations,
      studentsWithScores: studentsWithScores.length,
    };
  }, [students]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'GRADUATED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ALUMNI':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const topClasses = Object.entries(analytics.classDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total}</div>
          <p className="text-xs text-muted-foreground">
            +{analytics.recentRegistrations} this month
          </p>
        </CardContent>
      </Card>

      {/* Active Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {analytics.active}
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics.total > 0
              ? Math.round((analytics.active / analytics.total) * 100)
              : 0}
            % of total
          </p>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics.averagePerformance}%
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics.studentsWithScores} students assessed
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {analytics.lowPerformers + analytics.suspended + analytics.pending}
          </div>
          <p className="text-xs text-muted-foreground">
            Low performers + suspended + pending
          </p>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor('ACTIVE')}>
              Active: {analytics.active}
            </Badge>
            {analytics.suspended > 0 && (
              <Badge className={getStatusColor('SUSPENDED')}>
                Suspended: {analytics.suspended}
              </Badge>
            )}
            {analytics.graduated > 0 && (
              <Badge className={getStatusColor('GRADUATED')}>
                Graduated: {analytics.graduated}
              </Badge>
            )}
            {analytics.pending > 0 && (
              <Badge className={getStatusColor('PENDING')}>
                Pending: {analytics.pending}
              </Badge>
            )}
            {analytics.alumni > 0 && (
              <Badge className={getStatusColor('ALUMNI')}>
                Alumni: {analytics.alumni}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Class Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topClasses.map(([className, count]) => (
              <div
                key={className}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-medium">{className}</span>
                <Badge variant="outline">{count} students</Badge>
              </div>
            ))}
            {topClasses.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No class data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Gender Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Male</span>
              <Badge variant="outline">{analytics.male}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Female</span>
              <Badge variant="outline">{analytics.female}</Badge>
            </div>
            {analytics.genderNotSpecified > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Not Specified</span>
                <Badge variant="outline">{analytics.genderNotSpecified}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">High Performers (≥80%)</span>
              <Badge className="bg-green-100 text-green-800">
                {analytics.highPerformers}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Need Support (&lt;60%)</span>
              <Badge className="bg-red-100 text-red-800">
                {analytics.lowPerformers}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Not Assessed</span>
              <Badge variant="outline">
                {analytics.total - analytics.studentsWithScores}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
