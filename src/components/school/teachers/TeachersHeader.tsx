'use client'

import { useState } from 'react'
import { Button } from '../../ui/button'
import { 
  Plus, 
  Upload, 
  Download, 
  Search,
  FileSpreadsheet,
  FileText,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu'

interface TeachersHeaderProps {
  onAddTeacher: () => void
  onBulkUpload: () => void
  onExport: (format: 'excel' | 'pdf') => void
  teachersCount: number
}

export function TeachersHeader({ 
  onAddTeacher, 
  onBulkUpload, 
  onExport,
  teachersCount 
}: TeachersHeaderProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true)
    try {
      await onExport(format)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and Count */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your teaching staff ({teachersCount} total)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Advanced Search */}
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={() => {
              // TODO: Implement advanced search modal
              console.log('Advanced search clicked')
            }}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced Search</span>
            <span className="sm:hidden">Search</span>
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                disabled={isExporting || teachersCount === 0}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => handleExport('excel')}
                className="flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>Export to Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('pdf')}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4 text-red-600" />
                <span>Export to PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Upload */}
          <Button 
            variant="outline"
            onClick={onBulkUpload}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Upload</span>
          </Button>

          {/* Add New Teacher */}
          <Button 
            onClick={onAddTeacher}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New Teacher</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Active Teachers</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>On Leave</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Suspended</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Retired</span>
          </div>
        </div>
      </div>
    </div>
  )
}
