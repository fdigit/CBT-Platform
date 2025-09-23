'use client'

import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface ExamStatusBadgeProps {
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'PENDING'
  className?: string
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  },
  SCHEDULED: {
    label: 'Scheduled',
    variant: 'outline' as const,
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
  },
  ACTIVE: {
    label: 'Active',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-700 hover:bg-green-200'
  },
  CLOSED: {
    label: 'Closed',
    variant: 'secondary' as const,
    className: 'bg-red-100 text-red-700 hover:bg-red-200'
  },
  PENDING: {
    label: 'Pending Approval',
    variant: 'outline' as const,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
  }
}

export function ExamStatusBadge({ status, className }: ExamStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
