'use client';

import { BookOpen, CreditCard, Plus, School, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { AddSchoolModal } from './AddSchoolModal';
import { ExamChart, StudentGrowthChart, SubscriptionChart } from './Charts';
import { RecentActivities } from './RecentActivities';
import { StatsCard } from './StatsCard';

interface AdminStats {
  totalSchools: number;
  totalStudents: number;
  totalExams: number;
  activeExams: number;
  monthlyRevenue: number;
  recentSchools: number;
  recentStudents: number;
}

export function DashboardOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSchoolAdded = () => {
    // Refresh stats when a new school is added
    fetchStats();
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`;
    }
    return `₦${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-1">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="bg-white p-6 rounded-lg shadow animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your platform.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            onClick={() => setIsAddSchoolModalOpen(true)}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add School</span>
          </Button>
          <Button
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Create Exam</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Schools"
          value={stats?.totalSchools?.toString() || '0'}
          icon={School}
          change={{ value: stats?.recentSchools || 0, type: 'increase' }}
          description="Active schools on platform"
        />
        <StatsCard
          title="Total Students"
          value={formatNumber(stats?.totalStudents || 0)}
          icon={Users}
          change={{ value: stats?.recentStudents || 0, type: 'increase' }}
          description="Registered students"
        />
        <StatsCard
          title="Active Exams"
          value={stats?.activeExams?.toString() || '0'}
          icon={BookOpen}
          change={{
            value: Math.round(
              ((stats?.activeExams || 0) / (stats?.totalExams || 1)) * 100
            ),
            type: 'increase',
          }}
          description="Currently running"
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          icon={CreditCard}
          change={{ value: 15, type: 'increase' }}
          description="This month"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentGrowthChart />
        <ExamChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SubscriptionChart />
        <div className="lg:col-span-2">
          <RecentActivities />
        </div>
      </div>

      {/* Add School Modal */}
      <AddSchoolModal
        isOpen={isAddSchoolModalOpen}
        onClose={() => setIsAddSchoolModalOpen(false)}
        onSchoolAdded={handleSchoolAdded}
      />
    </div>
  );
}
