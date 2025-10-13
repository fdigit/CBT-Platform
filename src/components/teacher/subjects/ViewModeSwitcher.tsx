'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, Table2 } from 'lucide-react';

export type ViewMode = 'cards' | 'table' | 'list';

interface ViewModeSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeSwitcher({
  viewMode,
  onViewModeChange,
}: ViewModeSwitcherProps) {
  const viewModes: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] =
    [
      { mode: 'cards', icon: LayoutGrid, label: 'Cards View' },
      { mode: 'table', icon: Table2, label: 'Table View' },
      { mode: 'list', icon: List, label: 'List View' },
    ];

  return (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
      {viewModes.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange(mode)}
          className={cn(
            'h-8 px-3 transition-all',
            viewMode === mode
              ? 'bg-white text-blue-600 shadow-sm hover:bg-white hover:text-blue-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
          aria-label={label}
          aria-pressed={viewMode === mode}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}

