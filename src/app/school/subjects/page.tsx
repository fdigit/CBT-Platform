'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SchoolDashboardLayout } from '../../../components/school/SchoolDashboardLayout';
import {
    AssignClassesForm,
    AssignTeachersForm,
    ClassSubjectsTable,
    CreateSubjectForm,
    EditSubjectModal,
    SubjectsHeader,
    SubjectsTable,
    TeacherSubjectsTable,
} from '../../../components/school/subjects';
import type { CreateSubjectFormRef } from '../../../components/school/subjects/CreateSubjectForm';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../../../components/ui/tabs';
import { useToast } from '../../../hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: string;
  createdAt: string;
  _count: {
    teachers: number;
    classSubjects: number;
  };
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  employeeId: string;
}

interface Class {
  id: string;
  name: string;
  section?: string;
  academicYear: string;
}

interface TeacherSubjectAssignment {
  id: string;
  teacher: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
  };
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  createdAt: string;
}

interface ClassSubjectAssignment {
  id: string;
  class: {
    id: string;
    name: string;
    section?: string;
    academicYear: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
  };
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  createdAt: string;
}

export default function SubjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teacherSubjectAssignments, setTeacherSubjectAssignments] = useState<
    TeacherSubjectAssignment[]
  >([]);
  const [classSubjectAssignments, setClassSubjectAssignments] = useState<
    ClassSubjectAssignment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subjects');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const createSubjectFormRef = useRef<CreateSubjectFormRef>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchInitialData();
  }, [session, status, router]);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchSubjects(),
        fetchTeachers(),
        fetchClasses(),
        fetchTeacherSubjectAssignments(),
        fetchClassSubjectAssignments(),
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load initial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/school/subjects');
      
      if (!response.ok) {
        console.error('Failed to fetch subjects:', response.status, response.statusText);
        return;
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse subjects JSON:', jsonError);
        return;
      }
      
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/school/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/school/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTeacherSubjectAssignments = async () => {
    try {
      const response = await fetch('/api/school/subjects/assign-teachers');
      if (response.ok) {
        const data = await response.json();
        setTeacherSubjectAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching teacher-subject assignments:', error);
    }
  };

  const fetchClassSubjectAssignments = async () => {
    try {
      const response = await fetch('/api/school/subjects/assign-classes');
      if (response.ok) {
        const data = await response.json();
        setClassSubjectAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching class-subject assignments:', error);
    }
  };

  const handleSubjectCreated = (newSubject: Subject) => {
    setSubjects(prev => [newSubject, ...prev]);
  };

  const handleSubjectUpdate = (updatedSubject: Subject) => {
    setSubjects(prev =>
      prev.map(subject =>
        subject.id === updatedSubject.id ? updatedSubject : subject
      )
    );
    setEditingSubject(null);
  };

  const handleSubjectDelete = (subjectId: string) => {
    setSubjects(prev => prev.filter(subject => subject.id !== subjectId));
  };

  const handleAssignmentCreated = () => {
    fetchSubjects(); // Refresh subjects to update counts
    fetchTeacherSubjectAssignments();
    fetchClassSubjectAssignments();
  };

  if (status === 'loading' || loading) {
    return (
      <SchoolDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subjects...</p>
          </div>
        </div>
      </SchoolDashboardLayout>
    );
  }

  return (
    <SchoolDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <SubjectsHeader
          onAddSubject={() => {
            setActiveTab('subjects');
            // Focus the form after a short delay to ensure tab switch is complete
            setTimeout(() => {
              createSubjectFormRef.current?.focus();
            }, 100);
          }}
          onExport={() => {
            /* TODO: Implement export */
          }}
        />

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subjects">Subjects Management</TabsTrigger>
            <TabsTrigger value="teacher-assignments">
              Teacher Assignments
            </TabsTrigger>
            <TabsTrigger value="class-assignments">
              Class Assignments
            </TabsTrigger>
          </TabsList>

          {/* Subjects Management Tab */}
          <TabsContent value="subjects" className="space-y-6">
            <CreateSubjectForm
              ref={createSubjectFormRef}
              onSubjectCreated={handleSubjectCreated}
            />
            <SubjectsTable
              subjects={subjects}
              loading={false}
              onSubjectUpdate={setEditingSubject}
              onSubjectDelete={handleSubjectDelete}
              onRefresh={fetchSubjects}
            />

            <EditSubjectModal
              subject={editingSubject}
              isOpen={!!editingSubject}
              onClose={() => setEditingSubject(null)}
              onSubjectUpdated={handleSubjectUpdate}
            />
          </TabsContent>

          {/* Teacher Assignments Tab */}
          <TabsContent value="teacher-assignments" className="space-y-6">
            <AssignTeachersForm
              subjects={subjects.filter(s => s.status === 'ACTIVE')}
              teachers={teachers}
              onAssignmentCreated={handleAssignmentCreated}
            />
            <TeacherSubjectsTable
              assignments={teacherSubjectAssignments}
              loading={false}
              onRefresh={handleAssignmentCreated}
            />
          </TabsContent>

          {/* Class Assignments Tab */}
          <TabsContent value="class-assignments" className="space-y-6">
            <AssignClassesForm
              classes={classes}
              teachers={teachers}
              onAssignmentCreated={handleAssignmentCreated}
            />
            <ClassSubjectsTable
              assignments={classSubjectAssignments}
              loading={false}
              onRefresh={handleAssignmentCreated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SchoolDashboardLayout>
  );
}
