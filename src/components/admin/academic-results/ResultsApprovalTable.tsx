'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getGradeColor } from '@/lib/grading';
import { CheckCircle, Eye, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ResultRow {
  id: string;
  studentName: string;
  regNumber: string;
  subject: string;
  className: string;
  teacherName: string;
  term: string;
  session: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  actualGrade: string;
  gradePoint: number;
  remark?: string;
  status: string;
  teacherComment?: string;
  submittedAt?: string;
}

interface ResultsApprovalTableProps {
  results: ResultRow[];
  onApprove?: (
    resultId: string,
    comments: { hodComment?: string; principalComment?: string }
  ) => void;
  onReject?: (resultId: string, reason: string) => void;
  onRefresh?: () => void;
}

export function ResultsApprovalTable({
  results,
  onApprove,
  onReject,
  onRefresh,
}: ResultsApprovalTableProps) {
  const [selectedResult, setSelectedResult] = useState<ResultRow | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [hodComment, setHodComment] = useState('');
  const [principalComment, setPrincipalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleApproveClick = (result: ResultRow) => {
    setSelectedResult(result);
    setHodComment('');
    setPrincipalComment('');
    setShowApproveDialog(true);
  };

  const handleRejectClick = (result: ResultRow) => {
    setSelectedResult(result);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedResult) return;

    setProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/academic-results/approve/${selectedResult.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hodComment: hodComment || undefined,
            principalComment: principalComment || undefined,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Result approved successfully',
        });
        setShowApproveDialog(false);
        if (onRefresh) onRefresh();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to approve result',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while approving the result',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedResult || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/academic-results/reject/${selectedResult.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: rejectionReason,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Result rejected successfully',
        });
        setShowRejectDialog(false);
        if (onRefresh) onRefresh();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to reject result',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while rejecting the result',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="bg-gray-100">
            Draft
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Submitted</Badge>
        );
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'PUBLISHED':
        return <Badge className="bg-blue-100 text-blue-800">Published</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Term/Session</TableHead>
              <TableHead className="text-center">CA</TableHead>
              <TableHead className="text-center">Exam</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map(result => (
              <TableRow key={result.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{result.studentName}</p>
                    <p className="text-sm text-gray-500">{result.regNumber}</p>
                  </div>
                </TableCell>
                <TableCell>{result.className}</TableCell>
                <TableCell>{result.subject}</TableCell>
                <TableCell>{result.teacherName}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{result.term}</p>
                    <p className="text-gray-500">{result.session}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {result.caScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-center">
                  {result.examScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {result.totalScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={getGradeColor(result.actualGrade)}>
                    {result.actualGrade}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(result.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {result.status === 'SUBMITTED' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveClick(result)}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectClick(result)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedResult(result);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Result</DialogTitle>
            <DialogDescription>
              Approve result for {selectedResult?.studentName} -{' '}
              {selectedResult?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">
                <strong>Score:</strong> {selectedResult?.totalScore.toFixed(1)}{' '}
                ({selectedResult?.actualGrade})
              </p>
              <p className="text-sm">
                <strong>CA:</strong> {selectedResult?.caScore.toFixed(1)} |{' '}
                <strong>Exam:</strong> {selectedResult?.examScore.toFixed(1)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>HOD Comment (Optional)</Label>
              <Textarea
                value={hodComment}
                onChange={e => setHodComment(e.target.value)}
                placeholder="Enter HOD comment"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Principal's Comment (Optional)</Label>
              <Textarea
                value={principalComment}
                onChange={e => setPrincipalComment(e.target.value)}
                placeholder="Enter principal's comment"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button onClick={handleApproveConfirm} disabled={processing}>
                {processing ? 'Approving...' : 'Approve Result'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Result</DialogTitle>
            <DialogDescription>
              Reject result for {selectedResult?.studentName} -{' '}
              {selectedResult?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">
                <strong>Score:</strong> {selectedResult?.totalScore.toFixed(1)}{' '}
                ({selectedResult?.actualGrade})
              </p>
              <p className="text-sm">
                <strong>CA:</strong> {selectedResult?.caScore.toFixed(1)} |{' '}
                <strong>Exam:</strong> {selectedResult?.examScore.toFixed(1)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reason for Rejection *</Label>
              <Textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? 'Rejecting...' : 'Reject Result'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
