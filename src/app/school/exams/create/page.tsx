'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SchoolDashboardLayout } from '../../../../components/school/SchoolDashboardLayout';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Textarea } from '../../../../components/ui/textarea';
import { Switch } from '../../../../components/ui/switch';
import { useToast } from '../../../../hooks/use-toast';
import { examSchema } from '../../../../lib/validations';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'ESSAY';
  options?: string[];
  correctAnswer?: any;
  points: number;
}

export default function CreateExamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

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
      id: Date.now().toString(),
      text: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map(q => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId ? { ...q, options: [...(q.options || []), ''] } : q
      )
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(
      questions.map(q =>
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

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options?.filter((_, idx) => idx !== optionIndex),
            }
          : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = examSchema.parse(examData);

      const response = await fetch('/api/exams', {
        method: 'POST',
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
          description: 'Exam created successfully!',
        });
        router.push('/school');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create exam',
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/school')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Exam
            </h1>
            <p className="text-gray-600">
              Set up a new examination for your students
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Exam Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>
                Basic information about the examination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
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
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions ({questions.length})</CardTitle>
                  <CardDescription>
                    Add questions for your examination
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
                          {question.options?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center space-x-2"
                            >
                              <Input
                                value={option}
                                onChange={e =>
                                  updateOption(
                                    question.id,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  removeOption(question.id, optionIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Correct Answer */}
                      <div className="space-y-2">
                        <Label>Correct Answer *</Label>
                        {question.type === 'MCQ' ? (
                          <select
                            value={question.correctAnswer}
                            onChange={e =>
                              updateQuestion(
                                question.id,
                                'correctAnswer',
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select correct option</option>
                            {question.options?.map((option, index) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : question.type === 'TRUE_FALSE' ? (
                          <select
                            value={question.correctAnswer}
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
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </select>
                        ) : (
                          <Textarea
                            value={question.correctAnswer || ''}
                            onChange={e =>
                              updateQuestion(
                                question.id,
                                'correctAnswer',
                                e.target.value
                              )
                            }
                            placeholder="Expected answer or grading criteria..."
                            rows={3}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/school')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || questions.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating Exam...' : 'Create Exam'}
            </Button>
          </div>
        </form>
      </div>
    </SchoolDashboardLayout>
  );
}
