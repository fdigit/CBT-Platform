'use client';

import { ArrowLeft, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TeacherDashboardLayout } from '../../../../components/teacher';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import {
  FileUpload,
  UploadedFile,
} from '../../../../components/ui/file-upload';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { useToast } from '../../../../hooks/use-toast';

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

export default function CreateLessonPlan() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [materials, setMaterials] = useState<string[]>(['']);
  const [activities, setActivities] = useState<string[]>(['']);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [createdLessonPlanId, setCreatedLessonPlanId] = useState<string | null>(
    null
  );

  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    duration: 60,
    assessment: '',
    homework: '',
    notes: '',
    classId: '',
    subjectId: '',
    scheduledDate: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }

    fetchClassesAndSubjects();
  }, [session, status, router]);

  const fetchClassesAndSubjects = async () => {
    try {
      // Fetch teacher's classes and subjects
      const [classesRes, subjectsRes] = await Promise.all([
        fetch('/api/teacher/classes'),
        fetch('/api/teacher/subjects'),
      ]);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes || []);
      }

      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching classes and subjects:', error);
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
          ? setMaterials
          : setActivities;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (objectives.filter(obj => obj.trim()).length === 0) {
      toast({
        title: 'Error',
        description: 'At least one objective is required',
        variant: 'destructive',
      });
      return;
    }

    if (activities.filter(act => act.trim()).length === 0) {
      toast({
        title: 'Error',
        description: 'At least one activity is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // First, create the lesson plan
      const response = await fetch('/api/teacher/lesson-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          classId: formData.classId === 'none' ? null : formData.classId,
          subjectId: formData.subjectId === 'none' ? null : formData.subjectId,
          objectives: objectives.filter(obj => obj.trim()),
          materials: materials.filter(mat => mat.trim()),
          activities: activities.filter(act => act.trim()),
          duration: Number(formData.duration),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create lesson plan');
      }

      const lessonPlan = await response.json();
      setCreatedLessonPlanId(lessonPlan.id);

      // If there are files to upload, upload them
      if (uploadedFiles.length > 0) {
        console.log('Processing files for lesson plan:', uploadedFiles);
        setUploadingFiles(true);
        await uploadFilesToLessonPlan(lessonPlan.id);
        setUploadingFiles(false);
      } else {
        console.log('No files to upload');
      }

      toast({
        title: 'Success',
        description: 'Lesson plan created successfully',
      });

      router.push('/teacher/lesson-plans');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to create lesson plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
      console.log('Lesson plan ID:', lessonPlanId);

      // Create lesson plan resource records for each uploaded file
      for (const file of uploadedFiles) {
        console.log('Processing file:', file);
        if (file.uploaded && file.url) {
          console.log('Creating resource record for file:', file.name);
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
            const error = await response.json();
            console.error(
              'Failed to create resource record for file:',
              file.name,
              error
            );
          } else {
            const result = await response.json();
            console.log(
              'Successfully created resource record for:',
              file.name,
              result
            );
          }
        } else {
          console.log('Skipping file (not uploaded or no URL):', file);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const handleFileUpload = (files: UploadedFile[]) => {
    console.log('Files uploaded via FileUpload component:', files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (file: UploadedFile) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
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

  if (!session || session.user.role !== 'TEACHER') {
    return null;
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/teacher/lesson-plans')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create Lesson Plan
              </h1>
              <p className="text-gray-600 mt-1">
                Create a new lesson plan for your class
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
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
                      handleInputChange(
                        'duration',
                        parseInt(e.target.value) || 60
                      )
                    }
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
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not assigned</SelectItem>
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
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not assigned</SelectItem>
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

          {/* Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Learning Objectives *
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
            <CardContent className="space-y-2">
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
            <CardContent className="space-y-2">
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
                Lesson Activities *
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
            <CardContent className="space-y-2">
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

          {/* Assessment and Homework */}
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
                  placeholder="Describe how you will assess student learning"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="homework">Homework Assignment</Label>
                <Textarea
                  id="homework"
                  value={formData.homework}
                  onChange={e => handleInputChange('homework', e.target.value)}
                  placeholder="Describe any homework or follow-up activities"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes or considerations"
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

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/teacher/lesson-plans')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingFiles}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : uploadingFiles ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading Files...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Lesson Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </TeacherDashboardLayout>
  );
}
