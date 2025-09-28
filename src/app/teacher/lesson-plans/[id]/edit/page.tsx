'use client';

import { TeacherDashboardLayout } from '@/components/teacher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
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
import { ArrowLeft, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Class {
  id: string;
  name: string;
  section?: string;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
}

interface LessonPlan {
  id: string;
  title: string;
  topic?: string;
  duration: number;
  objectives: string[];
  materials: string[];
  activities: string[];
  assessment?: string;
  homework?: string;
  notes?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  classId?: string;
  subjectId?: string;
  resources: Array<{
    id: string;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    resourceType: string;
    uploadedAt: string;
  }>;
}

export default function EditLessonPlan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [materials, setMaterials] = useState<string[]>(['']);
  const [activities, setActivities] = useState<string[]>(['']);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    duration: 60,
    assessment: '',
    homework: '',
    notes: '',
    classId: 'none',
    subjectId: 'none',
    scheduledDate: '',
  });

  const [lessonPlanId, setLessonPlanId] = useState<string | null>(null);

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setLessonPlanId(resolvedParams.id);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !lessonPlanId) return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }

    fetchData();
  }, [session, status, router, lessonPlanId]);

  const fetchData = async () => {
    try {
      setInitialLoading(true);

      // Fetch lesson plan data
      const lessonPlanResponse = await fetch(
        `/api/teacher/lesson-plans/${lessonPlanId}`
      );
      if (!lessonPlanResponse.ok)
        throw new Error('Failed to fetch lesson plan');

      const lessonPlanData = await lessonPlanResponse.json();
      setLessonPlan(lessonPlanData);

      // Set form data
      setFormData({
        title: lessonPlanData.title || '',
        topic: lessonPlanData.topic || '',
        duration: lessonPlanData.duration || 60,
        assessment: lessonPlanData.assessment || '',
        homework: lessonPlanData.homework || '',
        notes: lessonPlanData.notes || '',
        classId: lessonPlanData.classId || 'none',
        subjectId: lessonPlanData.subjectId || 'none',
        scheduledDate: lessonPlanData.scheduledDate
          ? new Date(lessonPlanData.scheduledDate).toISOString().split('T')[0]
          : '',
      });

      // Set arrays
      setObjectives(
        lessonPlanData.objectives?.length > 0 ? lessonPlanData.objectives : ['']
      );
      setMaterials(
        lessonPlanData.materials?.length > 0 ? lessonPlanData.materials : ['']
      );
      setActivities(
        lessonPlanData.activities?.length > 0 ? lessonPlanData.activities : ['']
      );

      // Convert existing resources to UploadedFile format
      const existingFiles: UploadedFile[] =
        lessonPlanData.resources?.map((resource: any) => ({
          id: resource.id,
          name: resource.originalName,
          size: resource.fileSize,
          type: resource.mimeType,
          url: resource.filePath,
          uploaded: true,
          existing: true, // Mark as existing file
        })) || [];
      setUploadedFiles(existingFiles);

      // Fetch classes and subjects
      const [classesResponse, subjectsResponse] = await Promise.all([
        fetch('/api/teacher/classes'),
        fetch('/api/teacher/subjects'),
      ]);

      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      }

      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lesson plan data',
        variant: 'destructive',
      });
      router.push('/teacher/lesson-plans');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (
    field: 'objectives' | 'materials' | 'activities',
    index: number,
    value: string
  ) => {
    const setter =
      field === 'objectives'
        ? setObjectives
        : field === 'materials'
          ? setMaterials
          : setActivities;
    setter(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const addArrayItem = (field: 'objectives' | 'materials' | 'activities') => {
    const setter =
      field === 'objectives'
        ? setObjectives
        : field === 'materials'
          ? setMaterials
          : setActivities;
    setter(prev => [...prev, '']);
  };

  const removeArrayItem = (
    field: 'objectives' | 'materials' | 'activities',
    index: number
  ) => {
    const setter =
      field === 'objectives'
        ? setObjectives
        : field === 'materials'
          ? setActivities
          : setActivities;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (files: UploadedFile[]) => {
    setUploadingFiles(true);
    try {
      // Add new files to existing ones
      setUploadedFiles(prev => [...prev, ...files]);
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFileRemove = (file: UploadedFile) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
  };

  const getResourceType = (
    mimeType: string
  ):
    | 'DOCUMENT'
    | 'VIDEO'
    | 'AUDIO'
    | 'IMAGE'
    | 'PRESENTATION'
    | 'SPREADSHEET' => {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text')
    )
      return 'DOCUMENT';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return 'PRESENTATION';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return 'SPREADSHEET';
    return 'DOCUMENT'; // Default fallback
  };

  const uploadFilesToLessonPlan = async (lessonPlanId: string) => {
    try {
      console.log('Associating files with lesson plan:', uploadedFiles);

      // Create lesson plan resource records for each newly uploaded file
      for (const file of uploadedFiles) {
        if (file.uploaded && file.url && !file.existing) {
          const response = await fetch(
            `/api/teacher/lesson-plans/${lessonPlanId}/resources`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                originalName: file.name,
                filePath: file.url,
                fileSize: file.size,
                mimeType: file.type,
                resourceType: getResourceType(file.type),
              }),
            }
          );

          if (!response.ok) {
            console.error(
              'Failed to create resource record for file:',
              file.name
            );
          } else {
            console.log('Successfully created resource record for:', file.name);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonPlan) return;

    setLoading(true);
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        objectives: objectives.filter(obj => obj.trim() !== ''),
        materials: materials.filter(mat => mat.trim() !== ''),
        activities: activities.filter(act => act.trim() !== ''),
        classId: formData.classId === 'none' ? null : formData.classId,
        subjectId: formData.subjectId === 'none' ? null : formData.subjectId,
        scheduledDate: formData.scheduledDate || null,
      };

      const response = await fetch(
        `/api/teacher/lesson-plans/${lessonPlanId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update lesson plan');
      }

      // Upload files if any
      if (uploadedFiles.length > 0 && lessonPlanId) {
        await uploadFilesToLessonPlan(lessonPlanId);
      }

      toast({
        title: 'Success',
        description: 'Lesson plan updated successfully',
      });

      router.push('/teacher/lesson-plans');
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update lesson plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson plan...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'TEACHER' || !lessonPlan) {
    return null;
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Lesson Plan
              </h1>
              <p className="text-gray-600 mt-1">
                Update your lesson plan details
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    placeholder="Enter lesson title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={e => handleInputChange('topic', e.target.value)}
                    placeholder="Enter lesson topic"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={e =>
                      handleInputChange('duration', parseInt(e.target.value))
                    }
                    placeholder="60"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={e =>
                      handleInputChange('scheduledDate', e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="classId">Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={value => handleInputChange('classId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Class Assigned</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                          {cls.section && ` ${cls.section}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subjectId">Subject</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={value =>
                      handleInputChange('subjectId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Subject Assigned</SelectItem>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                          {subject.code && ` (${subject.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Learning Objectives
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('objectives')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Objective
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {objectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={objective}
                    onChange={e =>
                      handleArrayChange('objectives', index, e.target.value)
                    }
                    placeholder={`Objective ${index + 1}`}
                  />
                  {objectives.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('objectives', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Materials Needed
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('materials')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {materials.map((material, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={material}
                    onChange={e =>
                      handleArrayChange('materials', index, e.target.value)
                    }
                    placeholder={`Material ${index + 1}`}
                  />
                  {materials.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('materials', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Lesson Activities
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('activities')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={activity}
                    onChange={e =>
                      handleArrayChange('activities', index, e.target.value)
                    }
                    placeholder={`Activity ${index + 1}`}
                  />
                  {activities.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('activities', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Assessment & Homework */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment & Homework</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="assessment">Assessment Method</Label>
                <Textarea
                  id="assessment"
                  value={formData.assessment}
                  onChange={e =>
                    handleInputChange('assessment', e.target.value)
                  }
                  placeholder="Describe how you will assess student learning..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="homework">Homework Assignment</Label>
                <Textarea
                  id="homework"
                  value={formData.homework}
                  onChange={e => handleInputChange('homework', e.target.value)}
                  placeholder="Describe homework assignments..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes or considerations..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Lesson Plan Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onUpload={handleFileUpload}
                onRemove={handleFileRemove}
                uploadEndpoint="/api/upload/temp"
                maxFiles={10}
                maxSize={25}
                acceptedTypes={[
                  'pdf',
                  'doc',
                  'docx',
                  'ppt',
                  'pptx',
                  'xls',
                  'xlsx',
                  'txt',
                  'jpg',
                  'jpeg',
                  'png',
                  'gif',
                  'mp4',
                  'mp3',
                ]}
                existingFiles={uploadedFiles}
                disabled={loading || uploadingFiles}
                label="Upload Lesson Resources"
                description="Upload documents, presentations, images, or other resources for this lesson plan"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingFiles}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : uploadingFiles ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading Files...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Lesson Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </TeacherDashboardLayout>
  );
}
