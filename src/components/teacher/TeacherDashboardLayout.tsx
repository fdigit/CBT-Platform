'use client';

import { ReactNode } from 'react';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherTopNavbar } from './TeacherTopNavbar';

interface TeacherDashboardLayoutProps {
  children: ReactNode;
}

export function TeacherDashboardLayout({
  children,
}: TeacherDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherSidebar />
      <div className="lg:pl-64">
        <TeacherTopNavbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
