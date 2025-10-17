'use client';

import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  Menu,
  User,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface StudentSidebarProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/student',
    icon: LayoutDashboard,
  },
  {
    name: 'Assignments & Notes',
    href: '/student/assignments',
    icon: ClipboardList,
  },
  {
    name: 'Announcements',
    href: '/student/announcements',
    icon: Megaphone,
  },
  {
    name: 'My Exams',
    href: '/student/exams',
    icon: BookOpen,
  },
  {
    name: 'Results',
    href: '/student/results',
    icon: BarChart3,
  },
  {
    name: 'Profile',
    href: '/student/profile',
    icon: User,
  },
  {
    name: 'Support',
    href: '/student/support',
    icon: HelpCircle,
  },
];

export function StudentSidebar({ className }: StudentSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={toggleMobile}
      >
        {isMobileOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">
                  CBT Student
                </h1>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="hidden lg:flex"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map(item => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/student' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:text-gray-900',
                    isCollapsed && 'justify-center'
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon
                    className={cn('h-5 w-5', !isCollapsed && 'mr-3')}
                  />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* User info */}
          <div className="p-4">
            <div
              className={cn(
                'flex items-center',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'Student'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.studentProfile?.regNo || 'View Profile'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
