'use client';

import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

export interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  roleDistribution: {
    SUPER_ADMIN: number;
    SCHOOL_ADMIN: number;
    STUDENT: number;
  };
}

interface UserSummaryStatsProps {
  stats: UserStats;
  loading?: boolean;
}

export function UserSummaryStats({
  stats,
  loading = false,
}: UserSummaryStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeUsers =
    stats.totalUsers - (stats.roleDistribution.SUPER_ADMIN || 0);
  const suspendedUsers = 0; // This would need to be calculated from actual suspended users

  const statsData = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      description: 'All registered users',
      trend: null,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Users',
      value: activeUsers.toString(),
      icon: UserCheck,
      description: 'Currently active',
      trend: null,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'New This Month',
      value: stats.newUsersThisMonth.toString(),
      icon: UserPlus,
      description: 'Registered this month',
      trend: stats.newUsersThisMonth > 0 ? 'up' : null,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Suspended Users',
      value: suspendedUsers.toString(),
      icon: UserX,
      description: 'Currently suspended',
      trend: null,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const getRoleStats = () => {
    const roles = [
      {
        name: 'Students',
        count: stats.roleDistribution.STUDENT || 0,
        color: 'bg-blue-500',
      },
      {
        name: 'School Admins',
        count: stats.roleDistribution.SCHOOL_ADMIN || 0,
        color: 'bg-green-500',
      },
      {
        name: 'Super Admins',
        count: stats.roleDistribution.SUPER_ADMIN || 0,
        color: 'bg-red-500',
      },
    ];
    return roles.filter(role => role.count > 0);
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.trend && (
                  <div
                    className={`flex items-center text-xs ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    +12%
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Distribution by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getRoleStats().map((role, index) => {
              const percentage =
                stats.totalUsers > 0
                  ? ((role.count / stats.totalUsers) * 100).toFixed(1)
                  : '0';

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${role.color}`} />
                      <span className="text-sm font-medium">{role.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {role.count.toString()}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${role.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Growth Rate</h4>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  {stats.newUsersThisMonth > 0
                    ? `+${stats.newUsersThisMonth} new users this month`
                    : 'No new users this month'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Most Common Role</h4>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  {getRoleStats().length > 0
                    ? `${getRoleStats()[0].name} (${getRoleStats()[0].count})`
                    : 'No users found'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
