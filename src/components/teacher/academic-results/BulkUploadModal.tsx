'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  subjectId: string;
  subjectName: string;
  className: string;
  term: string;
  session: string;
  onSuccess?: () => void;
}

export function BulkUploadModal({
  open,
  onOpenChange,
  classId,
  subjectId,
  subjectName,
  className,
  term,
  session,
  onSuccess,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    created: number;
    updated: number;
    errors: Array<{ row: number; error: string; data?: any }>;
  } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResults(null);
    }
  };

  const downloadTemplate = () => {
    const template = `S/N,Student Name,Reg Number,CA Score,Exam Score,Remarks
1,John Doe,STU2024001,35,55,Good performance
2,Jane Smith,STU2024002,30,50,Very good
3,Example Student,STU2024003,38,58,Excellent`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', classId);
      formData.append('subjectId', subjectId);
      formData.append('term', term);
      formData.append('session', session);

      const response = await fetch(
        '/api/teacher/academic-results/bulk-upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUploadResults(data.results);
        toast({
          title: 'Success',
          description: data.message,
        });

        if (data.results.errors.length === 0 && onSuccess) {
          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
          }, 2000);
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to upload results',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Results</DialogTitle>
          <DialogDescription>
            Upload results for {className} - {subjectName} ({term}, {session})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  Download Template First
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Use our Excel template to ensure proper formatting. Required
                  columns: Reg Number, CA Score, Exam Score
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Select Excel/CSV File *</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Results
              </>
            )}
          </Button>

          {uploadResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Created
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {uploadResults.created}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Updated
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {uploadResults.updated}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Errors</p>
                      <p className="text-2xl font-bold text-red-600">
                        {uploadResults.errors.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {uploadResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-3 flex items-center">
                    <XCircle className="h-4 w-4 mr-2" />
                    Errors ({uploadResults.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadResults.errors.map((error, index) => (
                      <div
                        key={index}
                        className="bg-white border border-red-300 rounded p-2 text-sm"
                      >
                        <p className="font-medium text-red-800">
                          Row {error.row}: {error.error}
                        </p>
                        {error.data && (
                          <p className="text-xs text-gray-600 mt-1">
                            Data: {JSON.stringify(error.data)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResults.errors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">
                        Upload Successful!
                      </h4>
                      <p className="text-sm text-green-700">
                        All results uploaded successfully. The results are saved
                        as DRAFT. You can review and submit them for approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Upload Instructions
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Download the template and fill in student data</li>
              <li>
                Required columns: Reg Number, CA Score (0-40), Exam Score (0-60)
              </li>
              <li>Optional column: Remarks (teacher comments)</li>
              <li>Ensure registration numbers match exactly</li>
              <li>File formats: .xlsx, .xls, or .csv</li>
              <li>All results will be saved as DRAFT status</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
