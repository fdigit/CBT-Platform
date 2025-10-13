'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Download,
    Mail,
    MoreHorizontal,
    Upload,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface BatchActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchAction: (action: string) => void;
}

export function BatchActionsBar({
  selectedCount,
  onClearSelection,
  onBatchAction,
}: BatchActionsBarProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const handleActionClick = (actionId: string, label: string) => {
    setPendingAction({ id: actionId, label });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      onBatchAction(pendingAction.id);
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            {/* Selection Count */}
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-blue-600 h-7 px-3">
                {selectedCount} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-7 w-7 p-0"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200" />

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleActionClick('send-announcement', 'Send Announcement')
                }
                className="h-8"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Announcement
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleActionClick('export-report', 'Export Combined Report')
                }
                className="h-8"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      handleActionClick(
                        'bulk-resource-upload',
                        'Bulk Resource Upload'
                      )
                    }
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Resource Upload
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Batch Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to perform &quot;{pendingAction?.label}&quot; on{' '}
              {selectedCount} selected {selectedCount === 1 ? 'subject' : 'subjects'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

