'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Download, Upload } from 'lucide-react'

interface SubjectsHeaderProps {
  onAddSubject: () => void
  onExport?: () => void
  onImport?: () => void
}

export function SubjectsHeader({ 
  onAddSubject, 
  onExport, 
  onImport 
}: SubjectsHeaderProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-gray-600 mt-1">
            Manage subjects, assign teachers, and organize class schedules
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {onImport && (
            <Button variant="outline" onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import Subjects
            </Button>
          )}
          
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          
          <Button onClick={onAddSubject} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Subject
          </Button>
        </div>
      </div>
    </Card>
  )
}
