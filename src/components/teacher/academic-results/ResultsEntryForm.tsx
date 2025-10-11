'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface Student {
  id: string;
  regNumber: string;
  name: string;
  classId: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface ResultsEntryFormProps {
  students: Student[];
  subject: Subject;
  classId: string;
  term: string;
  session: string;
  onSuccess?: () => void;
}

export function ResultsEntryForm({
  students,
  subject,
  classId,
  term,
  session,
  onSuccess,
}: ResultsEntryFormProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [caScore, setCaScore] = useState<string>('');
  const [examScore, setExamScore] = useState<string>('');
  const [teacherComment, setTeacherComment] = useState<string>('');
  const [targetedGrade, setTargetedGrade] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive',
      });
      return;
    }

    const ca = parseFloat(caScore);
    const exam = parseFloat(examScore);

    if (isNaN(ca) || ca < 0 || ca > 40) {
      toast({
        title: 'Error',
        description: 'CA score must be between 0 and 40',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(exam) || exam < 0 || exam > 60) {
      toast({
        title: 'Error',
        description: 'Exam score must be between 0 and 60',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/teacher/academic-results/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          subjectId: subject.id,
          classId,
          term,
          session,
          caScore: ca,
          examScore: exam,
          teacherComment,
          targetedGrade: targetedGrade || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Result saved successfully',
        });

        setSelectedStudent('');
        setCaScore('');
        setExamScore('');
        setTeacherComment('');
        setTargetedGrade('');

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save result',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while saving the result',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalScore = (parseFloat(caScore) || 0) + (parseFloat(examScore) || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Result</CardTitle>
        <CardDescription>
          Enter CA and Exam scores for {subject.name} ({subject.code})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student">Student *</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.regNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caScore">CA Score (out of 40) *</Label>
              <Input
                id="caScore"
                type="number"
                min="0"
                max="40"
                step="0.5"
                value={caScore}
                onChange={e => setCaScore(e.target.value)}
                placeholder="Enter CA score"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examScore">Exam Score (out of 60) *</Label>
              <Input
                id="examScore"
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={examScore}
                onChange={e => setExamScore(e.target.value)}
                placeholder="Enter exam score"
              />
            </div>

            <div className="space-y-2">
              <Label>Total Score (out of 100)</Label>
              <div className="flex items-center h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50">
                {totalScore.toFixed(1)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetedGrade">Targeted Grade (Optional)</Label>
              <Select
                value={targetedGrade || 'none'}
                onValueChange={value =>
                  setTargetedGrade(value === 'none' ? '' : value)
                }
              >
                <SelectTrigger id="targetedGrade">
                  <SelectValue placeholder="Select target grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="A*">A*</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Teacher's Comment (Optional)</Label>
            <Textarea
              id="comment"
              rows={3}
              value={teacherComment}
              onChange={e => setTeacherComment(e.target.value)}
              placeholder="Enter your comment about the student's performance"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedStudent('');
                setCaScore('');
                setExamScore('');
                setTeacherComment('');
                setTargetedGrade('');
              }}
            >
              Clear
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Result'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
