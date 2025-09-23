'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface ExamActionsDropdownProps {
  exam: {
    id: string;
    title: string;
    examStatus: string;
    registeredStudents: number;
  };
  onExamUpdated: () => void;
}

export function ExamActionsDropdown({
  exam,
  onExamUpdated,
}: ExamActionsDropdownProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/exams/${exam.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam approved successfully',
        });
        onExamUpdated();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to approve exam',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve exam',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowApproveDialog(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/exams/${exam.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam rejected successfully',
        });
        onExamUpdated();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to reject exam',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject exam',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/exams/${exam.id}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam deleted successfully',
        });
        onExamUpdated();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete exam',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete exam',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleViewStats = () => {
    // Open stats modal or navigate to stats page
    window.open(`/admin/exams/${exam.id}/stats`, '_blank');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => window.open(`/exams/${exam.id}`, '_blank')}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Exam
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewStats}>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Statistics
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {exam.examStatus !== 'ACTIVE' && (
            <>
              <DropdownMenuItem
                onClick={() => setShowApproveDialog(true)}
                className="text-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowRejectDialog(true)}
                className="text-yellow-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            onClick={() =>
              window.open(`/admin/exams/${exam.id}/edit`, '_blank')
            }
            disabled={exam.examStatus === 'ACTIVE'}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
            disabled={exam.registeredStudents > 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the exam &quot;{exam.title}
              &quot;? This will notify the school that their exam has been
              approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting the exam &quot;{exam.title}
              &quot;. This will be sent to the school.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={loading}>
              {loading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the exam &quot;{exam.title}&quot;?
              This action cannot be undone.
              {exam.registeredStudents > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  This exam has {exam.registeredStudents} registered students
                  and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading || exam.registeredStudents > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
