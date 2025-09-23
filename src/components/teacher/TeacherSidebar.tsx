'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  FileText,
  ClipboardList,
  Trophy,
  BarChart3,
  MessageCircle,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  School,
  Layers,
  Calendar,
  ChevronDown,
  ChevronRight as ChevronRightSmall,
} from 'lucide-react';

interface TeacherSidebarProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Home',
    href: '/teacher',
    icon: LayoutDashboard,
  },
  {
    name: 'My Classes',
    href: '/teacher/classes',
    icon: Layers,
    expandable: true,
    subItems: [], // Will be populated dynamically
  },
  {
    name: 'My Subjects',
    href: '/teacher/subjects',
    icon: BookOpen,
  },
  {
    name: 'Lesson Plans & Notes',
    href: '/teacher/lessons',
    icon: FileText,
  },
  {
    name: 'Assignments & Tests',
    href: '/teacher/assignments',
    icon: ClipboardList,
  },
  {
    name: 'Exams (CBT)',
    href: '/teacher/exams',
    icon: Trophy,
  },
  {
    name: 'Students',
    href: '/teacher/students',
    icon: Users,
  },
  {
    name: 'Reports & Analytics',
    href: '/teacher/reports',
    icon: BarChart3,
  },
  {
    name: 'Messages',
    href: '/teacher/messages',
    icon: MessageCircle,
  },
  {
    name: 'Settings',
    href: '/teacher/settings',
    icon: Settings,
  },
];

export function TeacherSidebar({ className }: TeacherSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
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
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">
                  Teacher Portal
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
                pathname === item.href || pathname.startsWith(item.href + '/');
              const isExpanded = expandedItems.includes(item.name);

              return (
                <div key={item.name}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors flex-1',
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                        isCollapsed && 'justify-center'
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon
                        className={cn('h-5 w-5', !isCollapsed && 'mr-3')}
                      />
                      {!isCollapsed && item.name}
                    </Link>
                    {item.expandable && !isCollapsed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8"
                        onClick={() => toggleExpanded(item.name)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRightSmall className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Sub-items for expandable items */}
                  {item.expandable && isExpanded && !isCollapsed && (
                    <div className="ml-8 mt-1 space-y-1">
                      {/* These would be dynamically populated with teacher's classes */}
                      <Link
                        href="/teacher/classes/ss1-a"
                        className="block px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                      >
                        SS 1A - Mathematics
                      </Link>
                      <Link
                        href="/teacher/classes/ss2-b"
                        className="block px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                      >
                        SS 2B - Physics
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <Separator />

          {/* Footer */}
          <div className="p-4">
            <div
              className={cn(
                'flex items-center',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">TE</span>
                </div>
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Teacher</p>
                  <p className="text-xs text-gray-500">teacher@school.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
