'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  BookOpen,
  Trophy,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Student, Role } from '@/types/models';
import { format } from 'date-fns';
import { useToast } from '../../../hooks/use-toast';

interface StudentProfileDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onStudentUpdate: (student: Student) => void;
}

interface StudentDetails extends Student {
  recentExams?: Array<{
    examTitle: string;
    score: number;
    date: string;
    examDate: string;
  }>;
  totalExams?: number;
  totalAnswers?: number;
}

export function StudentProfileDrawer({
  student,
  isOpen,
  onClose,
  onStudentUpdate,
}: StudentProfileDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<Student>>({});
  const { toast } = useToast();

  // Fetch detailed student data when drawer opens
  const fetchStudentDetails = async (studentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/school/students/${studentId}`);
      if (response.ok) {
        const details = await response.json();
        setStudentDetails(details);
        setFormData(details);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch student details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load student details when student changes
  React.useEffect(() => {
    if (student && isOpen) {
      fetchStudentDetails(student.id);
    } else {
      setStudentDetails(null);
      setFormData({});
      setIsEditing(false);
    }
  }, [student, isOpen]);

  const handleSave = async () => {
    if (!student) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/school/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedStudent = await response.json();
        onStudentUpdate(updatedStudent);
        setStudentDetails({ ...studentDetails, ...updatedStudent });
        setIsEditing(false);
        toast({
          title: 'Success',
          description: 'Student updated successfully',
        });
      } else {
        throw new Error('Failed to update student');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update student',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(studentDetails || {});
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800' },
      SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-800' },
      GRADUATED: { label: 'Graduated', className: 'bg-blue-100 text-blue-800' },
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      ALUMNI: { label: 'Alumni', className: 'bg-purple-100 text-purple-800' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPerformanceColor = (score?: number) => {
    if (!score && score !== 0) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!student) return null;

  const displayStudent = studentDetails || student;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={undefined} />
                <AvatarFallback>
                  {getInitials(displayStudent.user?.name || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle>{displayStudent.user?.name}</SheetTitle>
                <SheetDescription>
                  {displayStudent.regNumber} • {displayStudent.user?.email}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={formData.user?.name || ''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              user: {
                                id: formData.user?.id || '',
                                email: formData.user?.email || '',
                                password: formData.user?.password || '',
                                name: e.target.value,
                                role: formData.user?.role || Role.STUDENT,
                                schoolId: formData.user?.schoolId || '',
                                createdAt:
                                  formData.user?.createdAt || new Date(),
                                updatedAt:
                                  formData.user?.updatedAt || new Date(),
                              },
                            })
                          }
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{displayStudent.user?.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={formData.user?.email || ''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              user: {
                                id: formData.user?.id || '',
                                email: e.target.value,
                                password: formData.user?.password || '',
                                name: formData.user?.name || '',
                                role: formData.user?.role || Role.STUDENT,
                                schoolId: formData.user?.schoolId || '',
                                createdAt:
                                  formData.user?.createdAt || new Date(),
                                updatedAt:
                                  formData.user?.updatedAt || new Date(),
                              },
                            })
                          }
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{displayStudent.user?.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      {isEditing ? (
                        <Select
                          value={''}
                          onValueChange={value =>
                            setFormData({
                              ...formData,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Not specified</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      {isEditing ? (
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                            })
                          }
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Not specified</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Parent Phone</Label>
                      {isEditing ? (
                        <Input
                          id="parentPhone"
                          value={''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                            })
                          }
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{'Not specified'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      {isEditing ? (
                        <Input
                          id="parentEmail"
                          type="email"
                          value={''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                            })
                          }
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>
                            {'Not specified'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        value={''}
                        onChange={e => setFormData({ ...formData })}
                        rows={3}
                      />
                    ) : (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span>{displayStudent.address || 'Not specified'}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      {isEditing ? (
                        <Input
                          id="class"
                          value={''}
                          onChange={e => setFormData({ ...formData })}
                        />
                      ) : (
                        <span>{displayStudent.class || 'Not assigned'}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      {isEditing ? (
                        <Input
                          id="section"
                          value={''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              section: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span>{displayStudent.section || 'Not assigned'}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      {isEditing ? (
                        <Select
                          value={''}
                          onValueChange={value =>
                            setFormData({
                              ...formData,
                              status: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            <SelectItem value="GRADUATED">Graduated</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="ALUMNI">Alumni</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span>Active</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Exams</p>
                        <p className="text-2xl font-bold">
                          {studentDetails?.totalExams || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-gray-600">Avg Performance</p>
                        <p
                          className={`text-2xl font-bold ${getPerformanceColor(displayStudent.performanceScore)}`}
                        >
                          {displayStudent.performanceScore !== null &&
                          displayStudent.performanceScore !== undefined
                            ? `${displayStudent.performanceScore}%`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Responses</p>
                        <p className="text-2xl font-bold">
                          {studentDetails?.totalAnswers || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {studentDetails?.recentExams &&
              studentDetails.recentExams.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Exam Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentDetails.recentExams.map((exam, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{exam.examTitle}</h4>
                            <p className="text-sm text-gray-600">
                              Taken on{' '}
                              {format(new Date(exam.examDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${getPerformanceColor(exam.score)}`}
                            >
                              {exam.score}%
                            </p>
                            <p className="text-xs text-gray-500">
                              Graded {format(new Date(exam.date), 'MMM dd')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No exam results available yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div>
                        <p className="font-medium">Student registered</p>
                        <p className="text-sm text-gray-600">
                          {format(
                            new Date(displayStudent.createdAt),
                            'MMM dd, yyyy at hh:mm a'
                          )}
                        </p>
                      </div>
                    </div>

                    {displayStudent.lastLogin && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <div>
                          <p className="font-medium">Last login</p>
                          <p className="text-sm text-gray-600">
                            {format(
                              new Date(displayStudent.lastLogin),
                              'MMM dd, yyyy at hh:mm a'
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {displayStudent.lastExamTaken && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                        <div>
                          <p className="font-medium">Last exam taken</p>
                          <p className="text-sm text-gray-600">
                            {format(
                              new Date(displayStudent.lastExamTaken),
                              'MMM dd, yyyy at hh:mm a'
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
