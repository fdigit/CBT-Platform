'use client';

import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Download,
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type:
    | 'MCQ'
    | 'TRUE_FALSE'
    | 'ESSAY'
    | 'SHORT_ANSWER'
    | 'FILL_IN_BLANK'
    | 'MATCHING';
  options: string[];
  correctAnswer: string | string[];
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation?: string;
  imageUrl?: string;
  tags: string[];
}

interface QuestionFileUploadProps {
  onQuestionsParsed: (questions: Question[]) => void;
  onClose?: () => void;
}

export function QuestionFileUpload({
  onQuestionsParsed,
  onClose,
}: QuestionFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/csv', // .csv
      'application/csv', // .csv
    ];

    // Also check file extension for CSV files (browsers sometimes don't set correct MIME type)
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isAllowedExtension = ['xlsx', 'xls', 'docx', 'doc', 'csv'].includes(
      fileExtension || ''
    );

    if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
      toast({
        title: 'Invalid file type',
        description:
          'Please upload Excel (.xlsx, .xls), CSV (.csv), or Word (.docx, .doc) files only.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/teacher/exams/parse-questions', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse questions');
      }

      const result = await response.json();
      setParsedQuestions(result.questions);

      toast({
        title: 'Questions parsed successfully',
        description: `Found ${result.count} questions in the file`,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to parse questions from file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleImportQuestions = () => {
    if (parsedQuestions.length > 0) {
      onQuestionsParsed(parsedQuestions);
      setParsedQuestions([]);
      if (onClose) onClose();
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template instead since XLSX might not be available on client side
    const templateData = [
      'Question,Type,Option A,Option B,Option C,Option D,Correct Answer,Points,Difficulty,Explanation',
      'What is the capital of France?,MCQ,London,Berlin,Paris,Madrid,Paris,1,EASY,Paris is the capital and largest city of France.',
      "The sun rises in the east.,TRUE_FALSE,,,,,True,1,EASY,The sun always rises in the east due to Earth's rotation.",
    ];

    const csvContent = templateData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'question_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Question File
          </CardTitle>
          <CardDescription>
            Upload an Excel (.xlsx, .xls), CSV (.csv), or Word (.docx, .doc)
            file containing exam questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <FileSpreadsheet className="h-12 w-12 text-green-600" />
                <FileText className="h-12 w-12 text-blue-600" />
              </div>

              <div>
                <p className="text-lg font-medium">
                  Drop your file here or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 underline"
                    disabled={uploading}
                  >
                    browse files
                  </button>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports Excel (.xlsx, .xls), CSV (.csv), and Word (.docx,
                  .doc) files up to 10MB
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Choose File
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  disabled={uploading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.docx,.doc"
            onChange={e => handleFileUpload(e.target.files)}
            className="hidden"
          />

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading and parsing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsed Questions Preview */}
      {parsedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Parsed Questions ({parsedQuestions.length})
              </div>
              <div className="flex gap-2">
                <Button onClick={handleImportQuestions} size="sm">
                  Import All Questions
                </Button>
                {onClose && (
                  <Button variant="outline" onClick={onClose} size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Review the parsed questions before importing them to your exam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {parsedQuestions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge variant="secondary">{question.type}</Badge>
                      <Badge
                        variant={
                          question.difficulty === 'EASY'
                            ? 'default'
                            : question.difficulty === 'MEDIUM'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {question.difficulty}
                      </Badge>
                      <Badge variant="outline">{question.points} pts</Badge>
                    </div>
                  </div>

                  <p className="font-medium mb-2">{question.text}</p>

                  {question.type === 'MCQ' && question.options.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="font-medium">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <span
                            className={
                              option === question.correctAnswer
                                ? 'text-green-600 font-medium'
                                : ''
                            }
                          >
                            {option}
                          </span>
                          {option === question.correctAnswer && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.explanation && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            File Format Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">
              Excel/CSV Format (.xlsx, .xls, .csv):
            </h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>
                • Use the first row as headers: Question, Type, Option A, Option
                B, Option C, Option D, Correct Answer, Points, Difficulty,
                Explanation
              </li>
              <li>
                • Question types: MCQ, TRUE_FALSE, ESSAY, SHORT_ANSWER,
                FILL_IN_BLANK, MATCHING
              </li>
              <li>• Difficulty levels: EASY, MEDIUM, HARD</li>
              <li>
                • For TRUE_FALSE questions, use "True" or "False" as the correct
                answer
              </li>
              <li>
                • For CSV files, use comma-separated values and wrap text
                containing commas in quotes
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Word Format (.docx, .doc):</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>
                • Start each question with a number (1., 2., etc.) or "Q1.",
                "Q2.", etc.
              </li>
              <li>• Use a), b), c), d) format for multiple choice options</li>
              <li>
                • Mark correct answers with "Answer:" or "Correct:" followed by
                the answer
              </li>
              <li>• Add explanations with "Explanation:" or "Reason:"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
