'use client';

import { SchoolAnnouncementList } from '@/components/school/announcements/SchoolAnnouncementList';
import { SchoolDashboardLayout } from '@/components/school/SchoolDashboardLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SchoolAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'SCHOOL_ADMIN') {
    return null;
  }

  const handleCreateNew = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Announcements
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Create and manage announcements for your school community
          </p>
        </div>

        <SchoolAnnouncementList
          onCreateNew={handleCreateNew}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </SchoolDashboardLayout>
  );
}
