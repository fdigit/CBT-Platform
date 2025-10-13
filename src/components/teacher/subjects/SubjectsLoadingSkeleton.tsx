'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewMode } from './ViewModeSwitcher';

interface SubjectsLoadingSkeletonProps {
  viewMode: ViewMode;
  count?: number;
}

export function SubjectsLoadingSkeleton({
  viewMode,
  count = 6,
}: SubjectsLoadingSkeletonProps) {
  if (viewMode === 'cards') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="p-3 rounded-lg bg-gray-50">
                    <Skeleton className="h-8 w-12 mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>

              {/* Performance Chart */}
              <div className="pt-4 border-t">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-32 w-full" />
              </div>

              {/* Classes List */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 mb-3" />
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-lg" />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left">
                    <Skeleton className="h-4 w-4" />
                  </th>
                  <th className="p-4 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="p-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="p-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="p-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="p-4 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="p-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: count }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">
                      <Skeleton className="h-4 w-4" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-6" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-8 w-8" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

