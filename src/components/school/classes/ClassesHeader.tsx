'use client';

import { Button } from '../../ui/button';
import { Plus, Download } from 'lucide-react';

interface ClassesHeaderProps {
  onAddClass: () => void;
  onExport: () => void;
}

export function ClassesHeader({ onAddClass, onExport }: ClassesHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-600">
            Manage your school&apos;s classes, assign teachers, and organize
            students
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onExport}
            variant="outline"
            size="sm"
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={onAddClass} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      {/* Mobile Export Button */}
      <div className="sm:hidden">
        <Button
          onClick={onExport}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Classes
        </Button>
      </div>
    </div>
  );
}
