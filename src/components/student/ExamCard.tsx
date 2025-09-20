'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Play, CheckCircle, Calendar, AlertCircle } from 'lucide-react'

interface ExamCardProps {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  status: 'upcoming' | 'active' | 'completed'
  isLive?: boolean
  onStartExam: (examId: string) => void
  onViewResult?: (examId: string) => void
  className?: string
}

export function ExamCard({
  id,
  title,
  description,
  startTime,
  endTime,
  duration,
  status,
  isLive = false,
  onStartExam,
  onViewResult,
  className
}: ExamCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    if (status === 'upcoming') {
      const updateCountdown = () => {
        const now = new Date()
        const start = new Date(startTime)
        const diff = start.getTime() - now.getTime()

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h ${minutes}m`)
          } else if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}m`)
          } else {
            setTimeLeft(`${minutes}m`)
          }
        } else {
          setTimeLeft('Starting soon...')
        }
      }

      updateCountdown()
      const interval = setInterval(updateCountdown, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [status, startTime])

  const getStatusBadge = () => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Upcoming</Badge>
      case 'active':
        return <Badge className="bg-green-600 text-white">Active</Badge>
      case 'completed':
        return <Badge className="bg-gray-600 text-white">Completed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getActionButton = () => {
    switch (status) {
      case 'active':
        return (
          <Button 
            onClick={() => onStartExam(id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Exam
          </Button>
        )
      case 'upcoming':
        return (
          <Button variant="outline" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Not Available
          </Button>
        )
      case 'completed':
        return (
          <Button 
            variant="outline" 
            onClick={() => onViewResult && onViewResult(id)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            View Results
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {isLive && (
                <Badge variant="destructive" className="text-xs">
                  🔴 LIVE
                </Badge>
              )}
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Duration: {duration} min</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {new Date(startTime).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <div>Start: {new Date(startTime).toLocaleString()}</div>
          <div>End: {new Date(endTime).toLocaleString()}</div>
        </div>

        {status === 'upcoming' && timeLeft && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Starts in: {timeLeft}
            </span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  )
}

