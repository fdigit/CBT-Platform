'use client';

import {
    BulkUploadModal,
    ResultsEntryForm,
    ResultsTable,
} from '@/components/teacher/academic-results';
import { TeacherDashboardLayout } from '@/components/teacher/TeacherDashboardLayout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    BookOpen,
    CheckCircle,
    FileText,
    PlusCircle,
    Send,
    Upload,
    XCircle,
} from 'lucide-react';
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
  code: string;
}

interface Student {
  id: string;
  regNumber: string;
  name: string;
  classId: string;
}

interface TermSession {
  term: string;
  session: string;
}

interface ResultRow {
  id: string;
  studentId: string;
  studentName: string;
  regNumber: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  actualGrade: string;
  gradePoint: number;
  remark?: string;
  status: string;
  teacherComment?: string;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-gray-700">{children}</label>
  );
}

export default function TeacherAcademicResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [termSessions, setTermSessions] = useState<TermSession[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');

  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }

    fetchInitialData();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm && selectedSession) {
      fetchResults();
      fetchStudents();
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedSession]);

  const fetchInitialData = async () => {
    try {
      const classesResponse = await fetch('/api/teacher/classes');
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      }

      const subjectsResponse = await fetch('/api/teacher/subjects');
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
      }

      const termSessionsResponse = await fetch(
        '/api/admin/term-session?activeOnly=true'
      );
      if (termSessionsResponse.ok) {
        const termData = await termSessionsResponse.json();
        const uniqueTerms: TermSession[] = [];
        const seen = new Set();

        termData.termSessions?.forEach((ts: any) => {
          const key = `${ts.term}-${ts.session}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueTerms.push({ term: ts.term, session: ts.session });
          }
        });

        setTermSessions(uniqueTerms);

        const current = termData.termSessions?.find((ts: any) => ts.isCurrent);
        if (current) {
          setSelectedTerm(current.term);
          setSelectedSession(current.session);
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;

    try {
      const response = await fetch(
        `/api/school/classes/${selectedClass}/students`
      );
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchResults = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedSession)
      return;

    try {
      const params = new URLSearchParams({
        classId: selectedClass,
        subjectId: selectedSubject,
        term: selectedTerm,
        session: selectedSession,
      });

      const response = await fetch(
        `/api/teacher/academic-results?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleDelete = async (resultId: string) => {
    if (!confirm('Are you sure you want to delete this result?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/teacher/academic-results?id=${resultId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Result deleted successfully',
        });
        fetchResults();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete result',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the result',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitForApproval = async () => {
    if (
      !selectedClass ||
      !selectedSubject ||
      !selectedTerm ||
      !selectedSession
    ) {
      toast({
        title: 'Error',
        description: 'Please select class, subject, term, and session',
        variant: 'destructive',
      });
      return;
    }

    const draftResults = results.filter(r => r.status === 'DRAFT');
    if (draftResults.length === 0) {
      toast({
        title: 'Info',
        description: 'No draft results to submit',
      });
      return;
    }

    if (
      !confirm(
        `Submit ${draftResults.length} results for approval? Once submitted, you cannot edit them until approved or rejected.`
      )
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/teacher/academic-results/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: selectedSubject,
          term: selectedTerm,
          session: selectedSession,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
        });
        fetchResults();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit results',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while submitting results',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <TeacherDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </TeacherDashboardLayout>
    );
  }

  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
  const draftCount = results.filter(r => r.status === 'DRAFT').length;
  const submittedCount = results.filter(r => r.status === 'SUBMITTED').length;
  const approvedCount = results.filter(r => r.status === 'APPROVED').length;
  const publishedCount = results.filter(r => r.status === 'PUBLISHED').length;

  return (
    <TeacherDashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Academic Results
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Enter and manage student results for CA and Exam scores
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center text-base md:text-lg">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Select Class, Subject, and Term
            </CardTitle>
            <CardDescription className="text-sm">
              Choose the class and subject you want to enter results for
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(termSessions.map(ts => ts.term))).map(
                      term => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Session</Label>
                <Select
                  value={selectedSession}
                  onValueChange={setSelectedSession}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Set(termSessions.map(ts => ts.session))
                    ).map(session => (
                      <SelectItem key={session} value={session}>
                        {session}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedClass &&
          selectedSubject &&
          selectedTerm &&
          selectedSession && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
                    <div className="sm:ml-2 md:ml-4">
                      <p className="text-xs md:text-sm font-medium text-gray-500">Draft</p>
                      <p className="text-xl md:text-2xl font-bold">{draftCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Send className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                    <div className="sm:ml-2 md:ml-4">
                      <p className="text-xs md:text-sm font-medium text-gray-500">
                        Submitted
                      </p>
                      <p className="text-xl md:text-2xl font-bold">{submittedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                    <div className="sm:ml-2 md:ml-4">
                      <p className="text-xs md:text-sm font-medium text-gray-500">
                        Approved
                      </p>
                      <p className="text-xl md:text-2xl font-bold">{approvedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <XCircle className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                    <div className="sm:ml-2 md:ml-4">
                      <p className="text-xs md:text-sm font-medium text-gray-500">
                        Published
                      </p>
                      <p className="text-xl md:text-2xl font-bold">{publishedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        {selectedClass &&
          selectedSubject &&
          selectedTerm &&
          selectedSession && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => setShowEntryForm(!showEntryForm)}
              >
                <PlusCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{showEntryForm ? 'Hide Form' : 'Add Result'}</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => setShowBulkUpload(true)}
              >
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Bulk Upload</span>
                <span className="sm:hidden">Upload</span>
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={handleSubmitForApproval}
                disabled={draftCount === 0 || submitting}
              >
                <Send className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {submitting ? 'Submitting...' : `Submit ${draftCount}`}
                </span>
                <span className="sm:hidden">Submit</span>
              </Button>
            </div>
          )}

        {showEntryForm &&
          selectedClass &&
          selectedSubject &&
          selectedTerm &&
          selectedSession &&
          selectedSubjectData && (
            <ResultsEntryForm
              students={students}
              subject={selectedSubjectData}
              classId={selectedClass}
              term={selectedTerm}
              session={selectedSession}
              onSuccess={() => {
                fetchResults();
                setShowEntryForm(false);
              }}
            />
          )}

        {selectedClass &&
          selectedSubject &&
          selectedTerm &&
          selectedSession && (
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Results</CardTitle>
                <CardDescription className="text-sm">
                  Showing results for{' '}
                  {selectedClassData
                    ? `${selectedClassData.name}${selectedClassData.section ? ` ${selectedClassData.section}` : ''}`
                    : 'selected class'}{' '}
                  - {selectedSubjectData?.name} ({selectedTerm},{' '}
                  {selectedSession})
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <ResultsTable
                  results={results}
                  onDelete={handleDelete}
                  showActions={true}
                />
              </CardContent>
            </Card>
          )}

        {!selectedClass ||
        !selectedSubject ||
        !selectedTerm ||
        !selectedSession ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select Class, Subject, and Term
                </h3>
                <p className="text-gray-600">
                  Choose a class, subject, term, and session to start entering
                  results
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {selectedClassData && selectedSubjectData && (
          <BulkUploadModal
            open={showBulkUpload}
            onOpenChange={setShowBulkUpload}
            classId={selectedClass}
            subjectId={selectedSubject}
            subjectName={selectedSubjectData.name}
            className={`${selectedClassData.name}${selectedClassData.section ? ` ${selectedClassData.section}` : ''}`}
            term={selectedTerm}
            session={selectedSession}
            onSuccess={() => {
              fetchResults();
              setShowBulkUpload(false);
            }}
          />
        )}
      </div>
    </TeacherDashboardLayout>
  );
}
