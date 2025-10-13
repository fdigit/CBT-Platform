'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ClipboardList,
  Download,
  FileText,
  MessageSquare,
  MoreVertical,
  TrendingUp,
  Trophy,
} from 'lucide-react';

export interface SubjectWithDetails {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  totalStudents: number;
  averageScore: number;
  completionRate: number;
  [key: string]: any;
}

interface SubjectActionMenuProps {
  subject: SubjectWithDetails;
  onAction: (action: string, subject: SubjectWithDetails) => void;
}

export function SubjectActionMenu({
  subject,
  onAction,
}: SubjectActionMenuProps) {
  const actions = [
    {
      id: 'create-exam',
      label: 'Create Exam',
      icon: Trophy,
      color: 'text-blue-600',
    },
    {
      id: 'create-assignment',
      label: 'Create Assignment',
      icon: ClipboardList,
      color: 'text-green-600',
    },
    {
      id: 'create-lesson-plan',
      label: 'Create Lesson Plan',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      id: 'view-analytics',
      label: 'View Analytics',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
    {
      id: 'message-students',
      label: 'Message Students',
      icon: MessageSquare,
      color: 'text-indigo-600',
    },
    {
      id: 'export-report',
      label: 'Export Report',
      icon: Download,
      color: 'text-gray-600',
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="More actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {actions.slice(0, 3).map(action => (
          <DropdownMenuItem
            key={action.id}
            onClick={() => onAction(action.id, subject)}
            className="cursor-pointer"
          >
            <action.icon className={`h-4 w-4 mr-2 ${action.color}`} />
            {action.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {actions.slice(3).map(action => (
          <DropdownMenuItem
            key={action.id}
            onClick={() => onAction(action.id, subject)}
            className="cursor-pointer"
          >
            <action.icon className={`h-4 w-4 mr-2 ${action.color}`} />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
