'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamSummaryStatsProps {
  stats: {
    totalExams: number
    activeExams: number
    scheduledExams: number
    closedExams: number
    pendingApprovals: number
  }
  className?: string
}

export function ExamSummaryStats({ stats, className }: ExamSummaryStatsProps) {
  const summaryCards = [
    {
      title: 'Total Exams',
      value: stats.totalExams,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All exams across schools'
    },
    {
      title: 'Active Exams',
      value: stats.activeExams,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Currently running'
    },
    {
      title: 'Scheduled Exams',
      value: stats.scheduledExams,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Starting soon'
    },
    {
      title: 'Closed Exams',
      value: stats.closedExams,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Completed exams'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Awaiting review'
    }
  ]

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6', className)}>
      {summaryCards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={cn('p-2 rounded-full', card.bgColor)}>
                <Icon className={cn('h-4 w-4', card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {card.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
