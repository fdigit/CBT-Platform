'use client';

import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface ExamTypeBadgeProps {
  type: 'OBJECTIVE' | 'THEORY' | 'CBT' | 'MIXED';
  className?: string;
}

const typeConfig = {
  OBJECTIVE: {
    label: 'Objective',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  THEORY: {
    label: 'Theory',
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
  CBT: {
    label: 'CBT',
    className: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
  },
  MIXED: {
    label: 'Mixed',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  },
};

export function ExamTypeBadge({ type, className }: ExamTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
