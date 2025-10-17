'use client';

import { AnnouncementList } from '@/components/teacher/announcements/AnnouncementList';
import { CreateAnnouncementDialog } from '@/components/teacher/announcements/CreateAnnouncementDialog';
import { TeacherDashboardLayout } from '@/components/teacher/TeacherDashboardLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TeacherAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'TEACHER') {
    return null;
  }

  const handleCreateNew = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Announcements
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Create and manage announcements for your classes
            </p>
          </div>
          <div className="flex justify-end">
            <CreateAnnouncementDialog onSuccess={handleCreateNew} />
          </div>
        </div>

        <AnnouncementList
          onCreateNew={handleCreateNew}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </TeacherDashboardLayout>
  );
}
