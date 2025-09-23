'use client';

import { ReactNode } from 'react';
import { SchoolSidebar } from './SchoolSidebar';
import { SchoolTopNavbar } from './SchoolTopNavbar';

interface SchoolDashboardLayoutProps {
  children: ReactNode;
}

export function SchoolDashboardLayout({
  children,
}: SchoolDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SchoolSidebar />
      <div className="lg:pl-64">
        <SchoolTopNavbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
