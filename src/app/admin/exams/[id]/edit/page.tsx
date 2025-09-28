'use client';

import { ArrowLeft, Eye, Plus, Save, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Switch } from '../../../../../components/ui/switch';
import { Textarea } from '../../../../../components/ui/textarea';
import { useToast } from '../../../../../hooks/use-toast';
import { examSchema } from '../../../../../lib/validations';

interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'ESSAY';
  options?: string[];
  correctAnswer?: any;
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  shuffle: boolean;
  negativeMarking: boolean;
  is_live: boolean;
  maxAttempts: number;
  questions: Question[];
}

export default function EditExamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();

  const [examData, setExamData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 60,
    shuffle: false,
    negativeMarking: false,
    is_live: false,
    maxAttempts: 1,
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchExam();
  }, [session, status, router, examId]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (response.ok) {
        const examData = await response.json();
        setExam(examData);
        setQuestions(examData.questions || []);

        // Format dates for input fields
        setExamData({
          title: examData.title,
          description: examData.description || '',
          startTime: new Date(examData.startTime).toISOString().slice(0, 16),
          endTime: new Date(examData.endTime).toISOString().slice(0, 16),
          duration: examData.duration,
          shuffle: examData.shuffle,
          negativeMarking: examData.negativeMarking,
          is_live: examData.is_live || false,
          maxAttempts: examData.maxAttempts || 1,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch exam details',
          variant: 'destructive',
        });
        router.push('/admin/exams');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching exam',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setExamData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp_${Date.now()}`,
      text: '',
      type: 'MCQ',
      options: ['', ''],
      correctAnswer: '',
      points: 1,
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const updateQuestion = (
    questionId: string,
    field: keyof Question,
    value: any
  ) => {
    setQuestions(prev =>
      prev.map(q => (q.id === questionId ? { ...q, [field]: value } : q))
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: [...(q.options || []), ''],
            }
          : q
      )
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options?.filter((_, idx) => idx !== optionIndex),
            }
          : q
      )
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options?.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const validatedData = examSchema.parse(examData);

      const response = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam: validatedData,
          questions: questions,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam updated successfully!',
        });
        router.push('/admin/exams');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update exam',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Please check your input and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this exam? This action cannot be undone.'
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exam deleted successfully!',
        });
        router.push('/admin/exams');
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
        description: 'An error occurred while deleting exam',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/exams')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Exams
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Exam</h1>
                <p className="text-gray-600">
                  Modify exam details and questions
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/exams/${examId}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Exam
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Exam Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>
                Basic information about the examination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={examData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Mathematics Midterm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    value={examData.duration}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts *</Label>
                  <Input
                    id="maxAttempts"
                    name="maxAttempts"
                    type="number"
                    value={examData.maxAttempts}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={examData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the exam..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    value={examData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="datetime-local"
                    value={examData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shuffle"
                    checked={examData.shuffle}
                    onCheckedChange={checked =>
                      handleSwitchChange('shuffle', checked)
                    }
                  />
                  <Label htmlFor="shuffle">Shuffle Questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="negativeMarking"
                    checked={examData.negativeMarking}
                    onCheckedChange={checked =>
                      handleSwitchChange('negativeMarking', checked)
                    }
                  />
                  <Label htmlFor="negativeMarking">Negative Marking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_live"
                    checked={examData.is_live}
                    onCheckedChange={checked =>
                      handleSwitchChange('is_live', checked)
                    }
                  />
                  <Label
                    htmlFor="is_live"
                    className="text-green-600 font-medium"
                  >
                    Make Live (Override Schedule)
                  </Label>
                </div>
              </div>

              {examData.is_live && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800 text-sm">
                    <strong>Live Mode:</strong> Students can take this exam
                    immediately, regardless of the scheduled start/end times.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions ({questions.length})</CardTitle>
                  <CardDescription>
                    Add and edit questions for your examination
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addQuestion}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>
                    No questions added yet. Click &quot;Add Question&quot; to
                    get started.
                  </p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <Card key={question.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Question {index + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Question Text *</Label>
                        <Textarea
                          value={question.text}
                          onChange={e =>
                            updateQuestion(question.id, 'text', e.target.value)
                          }
                          placeholder="Enter your question here..."
                          rows={3}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Question Type *</Label>
                          <select
                            value={question.type}
                            onChange={e =>
                              updateQuestion(
                                question.id,
                                'type',
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="MCQ">Multiple Choice</option>
                            <option value="TRUE_FALSE">True/False</option>
                            <option value="ESSAY">Essay</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Points *</Label>
                          <Input
                            type="number"
                            value={question.points}
                            onChange={e =>
                              updateQuestion(
                                question.id,
                                'points',
                                parseFloat(e.target.value)
                              )
                            }
                            min="0.5"
                            step="0.5"
                          />
                        </div>
                      </div>

                      {/* Options for MCQ and True/False */}
                      {(question.type === 'MCQ' ||
                        question.type === 'TRUE_FALSE') && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Options *</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(question.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {question.options?.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className="flex items-center space-x-2"
                              >
                                <Input
                                  value={option}
                                  onChange={e =>
                                    updateOption(
                                      question.id,
                                      optIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Option ${optIndex + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    removeOption(question.id, optIndex)
                                  }
                                  disabled={question.options!.length <= 2}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <Label>Correct Answer *</Label>
                            <select
                              value={question.correctAnswer || ''}
                              onChange={e =>
                                updateQuestion(
                                  question.id,
                                  'correctAnswer',
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Select correct answer</option>
                              {question.options?.map((option, optIndex) => (
                                <option key={optIndex} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Essay questions */}
                      {question.type === 'ESSAY' && (
                        <div className="space-y-2">
                          <Label>Sample Answer (Optional)</Label>
                          <Textarea
                            value={question.correctAnswer || ''}
                            onChange={e =>
                              updateQuestion(
                                question.id,
                                'correctAnswer',
                                e.target.value
                              )
                            }
                            placeholder="Provide a sample answer or marking criteria..."
                            rows={3}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading || questions.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
