'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Building,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface SchoolsSummaryProps {
  summary: {
    total: number;
    pending: number;
    approved: number;
    suspended: number;
    rejected: number;
  };
  loading?: boolean;
}

export function SchoolsSummary({ summary, loading }: SchoolsSummaryProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Schools',
      value: summary.total,
      description: 'All registered schools',
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Approval',
      value: summary.pending,
      description: 'Awaiting review',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      badge: summary.pending > 0 ? 'Action Required' : undefined,
    },
    {
      title: 'Active Schools',
      value: summary.approved,
      description: 'Currently operational',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Suspended',
      value: summary.suspended,
      description: 'Temporarily disabled',
      icon: Pause,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Rejected',
      value: summary.rejected,
      description: 'Application denied',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Alert for pending approvals */}
      {summary.pending > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            You have <strong>{summary.pending}</strong> school
            {summary.pending !== 1 ? 's' : ''} pending approval that require
            {summary.pending === 1 ? 's' : ''} your attention.
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cards.map((card, index) => (
          <Card key={index} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {card.value.toLocaleString()}
                </div>
                {card.badge && (
                  <Badge variant="outline" className="text-xs">
                    {card.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold">
                {summary.total > 0
                  ? Math.round(
                      (summary.approved / (summary.total - summary.pending)) *
                        100
                    )
                  : 0}
                %
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              Of processed applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold">
                {summary.total > 0
                  ? Math.round((summary.approved / summary.total) * 100)
                  : 0}
                %
              </div>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              Of all registered schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Issues Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold">
                {summary.pending + summary.suspended}
              </div>
              {summary.pending + summary.suspended > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending + Suspended schools
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
