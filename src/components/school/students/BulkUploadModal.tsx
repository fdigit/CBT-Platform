'use client';

import { useState, useRef } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Student } from '../../app/school/students/page';
import { useToast } from '../../../hooks/use-toast';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentsAdded: (students: Student[]) => void;
}

interface ParsedStudent {
  name: string;
  email: string;
  regNumber?: string;
  gender?: 'MALE' | 'FEMALE';
  class?: string;
  section?: string;
  parentPhone?: string;
  parentEmail?: string;
  dateOfBirth?: string;
  address?: string;
  errors?: string[];
}

interface UploadResult {
  success: boolean;
  data?: Student[];
  errors?: string[];
  duplicates?: string[];
}

const CSV_TEMPLATE_HEADERS = [
  'name',
  'email',
  'regNumber',
  'gender',
  'class',
  'section',
  'parentPhone',
  'parentEmail',
  'dateOfBirth',
  'address',
];

const SAMPLE_DATA = [
  [
    'John Doe',
    'john.doe@example.com',
    'STU20241001',
    'MALE',
    'SS 1',
    'A',
    '08012345678',
    'parent@example.com',
    '2005-03-15',
    '123 Main Street',
  ],
  [
    'Jane Smith',
    'jane.smith@example.com',
    'STU20241002',
    'FEMALE',
    'SS 1',
    'B',
    '08087654321',
    'parent2@example.com',
    '2005-07-22',
    '456 Oak Avenue',
  ],
];

export function BulkUploadModal({
  isOpen,
  onClose,
  onStudentsAdded,
}: BulkUploadModalProps) {
  const [step, setStep] = useState<
    'upload' | 'preview' | 'processing' | 'results'
  >('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setUploadResult(null);
    setShowPasswords(false);
    setLoading(false);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = [
      CSV_TEMPLATE_HEADERS.join(','),
      ...SAMPLE_DATA.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded successfully',
    });
  };

  const parseCSV = (csvText: string): ParsedStudent[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const student: ParsedStudent = {
        name: '',
        email: '',
        errors: [],
      };

      headers.forEach((header, i) => {
        const value = values[i] || '';
        switch (header) {
          case 'name':
            student.name = value;
            break;
          case 'email':
            student.email = value.toLowerCase();
            break;
          case 'regnumber':
          case 'reg_number':
          case 'registration_number':
            student.regNumber = value;
            break;
          case 'gender':
            if (
              value.toUpperCase() === 'MALE' ||
              value.toUpperCase() === 'FEMALE'
            ) {
              student.gender = value.toUpperCase() as 'MALE' | 'FEMALE';
            }
            break;
          case 'class':
            student.class = value;
            break;
          case 'section':
            student.section = value;
            break;
          case 'parentphone':
          case 'parent_phone':
            student.parentPhone = value;
            break;
          case 'parentemail':
          case 'parent_email':
            student.parentEmail = value.toLowerCase();
            break;
          case 'dateofbirth':
          case 'date_of_birth':
          case 'dob':
            student.dateOfBirth = value;
            break;
          case 'address':
            student.address = value;
            break;
        }
      });

      // Validate required fields
      if (!student.name) {
        student.errors!.push('Name is required');
      }
      if (!student.email) {
        student.errors!.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
        student.errors!.push('Invalid email format');
      }
      if (
        student.parentEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.parentEmail)
      ) {
        student.errors!.push('Invalid parent email format');
      }

      return student;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = e => {
      const csvText = e.target?.result as string;
      try {
        const parsed = parseCSV(csvText);
        setParsedData(parsed);
        setStep('preview');
      } catch (error) {
        toast({
          title: 'Parse Error',
          description: 'Failed to parse CSV file. Please check the format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    const validStudents = parsedData.filter(
      student => !student.errors || student.errors.length === 0
    );

    if (validStudents.length === 0) {
      toast({
        title: 'No Valid Students',
        description: 'Please fix the errors before uploading',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const response = await fetch('/api/school/students/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: validStudents }),
      });

      const result = await response.json();
      setUploadResult(result);

      if (result.success && result.data) {
        onStudentsAdded(result.data);
        toast({
          title: 'Upload Successful',
          description: `${result.data.length} students added successfully`,
        });
      }

      setStep('results');
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload students. Please try again.',
        variant: 'destructive',
      });
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const validStudents = parsedData.filter(
    student => !student.errors || student.errors.length === 0
  );
  const invalidStudents = parsedData.filter(
    student => student.errors && student.errors.length > 0
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === 'upload' && (
          <>
            <DialogHeader>
              <DialogTitle>Bulk Upload Students</DialogTitle>
              <DialogDescription>
                Upload multiple students at once using a CSV file. Download the
                template to see the required format.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>Step 1: Download Template</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Download the CSV template with sample data to see the
                    required format and column headers.
                  </p>
                  <Button onClick={downloadTemplate} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Step 2: Upload Your File</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {file ? file.name : 'Choose CSV file to upload'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Select a CSV file with student data
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required columns:</strong> name, email
                  <br />
                  <strong>Optional columns:</strong> regNumber, gender, class,
                  section, parentPhone, parentEmail, dateOfBirth, address
                  <br />
                  If regNumber is not provided, it will be auto-generated.
                  Passwords will be auto-generated for all students.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'preview' && (
          <>
            <DialogHeader>
              <DialogTitle>Preview & Validate Data</DialogTitle>
              <DialogDescription>
                Review the parsed data before uploading. Fix any errors shown
                below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <Badge className="bg-green-100 text-green-800">
                    {validStudents.length} Valid
                  </Badge>
                  {invalidStudents.length > 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      {invalidStudents.length} Invalid
                    </Badge>
                  )}
                  <Badge variant="outline">{parsedData.length} Total</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Different File
                </Button>
              </div>

              <div className="max-h-96 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Reg Number</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {student.errors && student.errors.length > 0 ? (
                            <X className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                        <TableCell>{student.name || '-'}</TableCell>
                        <TableCell>{student.email || '-'}</TableCell>
                        <TableCell>
                          {student.regNumber || 'Auto-generate'}
                        </TableCell>
                        <TableCell>{student.class || '-'}</TableCell>
                        <TableCell>{student.gender || '-'}</TableCell>
                        <TableCell>
                          {student.errors && student.errors.length > 0 && (
                            <div className="space-y-1">
                              {student.errors.map((error, i) => (
                                <Badge
                                  key={i}
                                  className="bg-red-100 text-red-800 text-xs"
                                >
                                  {error}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {invalidStudents.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {invalidStudents.length} students have validation errors and
                    will be skipped. Only {validStudents.length} valid students
                    will be uploaded.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleUpload}
                disabled={validStudents.length === 0}
              >
                Upload {validStudents.length} Students
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'processing' && (
          <>
            <DialogHeader>
              <DialogTitle>Processing Upload</DialogTitle>
              <DialogDescription>
                Please wait while we create the student accounts...
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  Creating {validStudents.length} student accounts...
                </p>
              </div>
            </div>
          </>
        )}

        {step === 'results' && uploadResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Upload Complete</span>
              </DialogTitle>
              <DialogDescription>
                Here's a summary of the bulk upload results.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {uploadResult.success && uploadResult.data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">
                      Successfully Created: {uploadResult.data.length} students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Generated Passwords:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {showPasswords ? 'Hide' : 'Show'}
                        </Button>
                      </div>

                      {showPasswords && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Important:</strong> These passwords will not
                            be shown again. Please save them securely and share
                            with students.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">
                      Errors: {uploadResult.errors.length}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {uploadResult.errors.map((error, index) => (
                        <Badge key={index} className="bg-red-100 text-red-800">
                          {error}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {uploadResult.duplicates &&
                uploadResult.duplicates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-yellow-600">
                        Skipped Duplicates: {uploadResult.duplicates.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {uploadResult.duplicates.map((duplicate, index) => (
                          <Badge
                            key={index}
                            className="bg-yellow-100 text-yellow-800"
                          >
                            {duplicate}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
