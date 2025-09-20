'use client'

import { ReactNode } from 'react'
import { StudentSidebar } from './StudentSidebar'
import { StudentTopNavbar } from './StudentTopNavbar'

interface StudentDashboardLayoutProps {
  children: ReactNode
}

export function StudentDashboardLayout({ children }: StudentDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="lg:pl-64">
        <StudentTopNavbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

