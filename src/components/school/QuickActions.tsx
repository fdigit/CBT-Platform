'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Plus, Users, BookOpen, Upload, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  onClick: () => void
}

export function QuickActions() {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      title: 'Add Student',
      description: 'Register a new student to the system',
      icon: Users,
      iconColor: 'text-green-600',
      onClick: () => router.push('/school/students/add')
    },
    {
      title: 'Create Exam',
      description: 'Create a new exam with questions',
      icon: BookOpen,
      iconColor: 'text-blue-600',
      onClick: () => router.push('/school/exams/create')
    },
    {
      title: 'Import Questions',
      description: 'Bulk upload questions from Excel/CSV',
      icon: Upload,
      iconColor: 'text-purple-600',
      onClick: () => router.push('/school/questions/import')
    },
    {
      title: 'View Reports',
      description: 'Analyze student performance and results',
      icon: BarChart3,
      iconColor: 'text-orange-600',
      onClick: () => router.push('/school/reports')
    }
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action, index) => (
        <Card 
          key={index}
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
          onClick={action.onClick}
        >
          <CardHeader>
            <div className="flex items-center space-x-2">
              <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              <CardTitle className="text-lg">{action.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              {action.description}
            </CardDescription>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 w-full"
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {action.title}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
