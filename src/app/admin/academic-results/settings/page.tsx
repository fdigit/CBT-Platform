'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SchoolDashboardLayout } from '@/components/school/SchoolDashboardLayout';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_GRADING_SCALE } from '@/lib/grading';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface GradingScaleRow {
  minScore: number;
  maxScore: number;
  grade: string;
  gradePoint: number;
  remark: string;
}

interface TermSessionRow {
  id?: string;
  term: string;
  session: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export default function AdminAcademicResultsSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [gradingScales, setGradingScales] = useState<GradingScaleRow[]>([]);
  const [termSessions, setTermSessions] = useState<TermSessionRow[]>([]);

  const [newTerm, setNewTerm] = useState('');
  const [newSession, setNewSession] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newIsCurrent, setNewIsCurrent] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (
      !session ||
      !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)
    ) {
      router.push('/auth/signin');
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const gradingResponse = await fetch('/api/admin/grading-scale');
      if (gradingResponse.ok) {
        const gradingData = await gradingResponse.json();
        if (gradingData.gradingScales && gradingData.gradingScales.length > 0) {
          setGradingScales(
            gradingData.gradingScales.map((scale: any) => ({
              minScore: scale.minScore,
              maxScore: scale.maxScore,
              grade: scale.grade,
              gradePoint: scale.gradePoint,
              remark: scale.remark,
            }))
          );
        } else {
          setGradingScales(DEFAULT_GRADING_SCALE);
        }
      }

      const termResponse = await fetch('/api/admin/term-session');
      if (termResponse.ok) {
        const termData = await termResponse.json();
        setTermSessions(
          termData.termSessions?.map((ts: any) => ({
            id: ts.id,
            term: ts.term,
            session: ts.session,
            startDate: new Date(ts.startDate).toISOString().split('T')[0],
            endDate: new Date(ts.endDate).toISOString().split('T')[0],
            isCurrent: ts.isCurrent,
          })) || []
        );
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGradingScale = async () => {
    for (const scale of gradingScales) {
      if (
        scale.minScore < 0 ||
        scale.maxScore > 100 ||
        scale.minScore >= scale.maxScore
      ) {
        toast({
          title: 'Error',
          description: 'Invalid score ranges in grading scale',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch('/api/admin/grading-scale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gradingScales,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Grading scale saved successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save grading scale',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while saving grading scale',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Reset to default Nigerian grading scale?')) {
      setGradingScales(DEFAULT_GRADING_SCALE);
    }
  };

  const handleAddTermSession = async () => {
    if (!newTerm || !newSession || !newStartDate || !newEndDate) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/term-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: newTerm,
          session: newSession,
          startDate: newStartDate,
          endDate: newEndDate,
          isCurrent: newIsCurrent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Term/Session added successfully',
        });

        setNewTerm('');
        setNewSession('');
        setNewStartDate('');
        setNewEndDate('');
        setNewIsCurrent(false);

        fetchSettings();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to add term/session',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while adding term/session',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTermSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this term/session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/term-session?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Term/Session deleted successfully',
        });
        fetchSettings();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete term/session',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting term/session',
        variant: 'destructive',
      });
    }
  };

  const isSchoolAdmin = session?.user?.role === 'SCHOOL_ADMIN';
  const LayoutComponent = isSchoolAdmin
    ? SchoolDashboardLayout
    : DashboardLayout;

  if (status === 'loading' || loading) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/academic-results')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Results Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Configure grading scales and academic terms/sessions
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Grading Scale</CardTitle>
                <CardDescription>
                  Configure the grading scale for your school
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefault}
                >
                  Reset to Default
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveGradingScale}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Grading Scale'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Score</TableHead>
                    <TableHead>Max Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Grade Point</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradingScales.map((scale, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          type="number"
                          value={scale.minScore}
                          onChange={e => {
                            const newScales = [...gradingScales];
                            newScales[index].minScore = parseFloat(
                              e.target.value
                            );
                            setGradingScales(newScales);
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={scale.maxScore}
                          onChange={e => {
                            const newScales = [...gradingScales];
                            newScales[index].maxScore = parseFloat(
                              e.target.value
                            );
                            setGradingScales(newScales);
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={scale.grade}
                          onChange={e => {
                            const newScales = [...gradingScales];
                            newScales[index].grade = e.target.value;
                            setGradingScales(newScales);
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          value={scale.gradePoint}
                          onChange={e => {
                            const newScales = [...gradingScales];
                            newScales[index].gradePoint = parseFloat(
                              e.target.value
                            );
                            setGradingScales(newScales);
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={scale.remark}
                          onChange={e => {
                            const newScales = [...gradingScales];
                            newScales[index].remark = e.target.value;
                            setGradingScales(newScales);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Academic Terms & Sessions
            </CardTitle>
            <CardDescription>
              Manage academic terms and sessions for your school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-4">Add New Term/Session</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newTerm">Term</Label>
                  <select
                    id="newTerm"
                    value={newTerm}
                    onChange={e => setNewTerm(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">Select term</option>
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newSession">Session</Label>
                  <Input
                    id="newSession"
                    type="text"
                    value={newSession}
                    onChange={e => setNewSession(e.target.value)}
                    placeholder="2024/2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Current Term</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Switch
                      checked={newIsCurrent}
                      onCheckedChange={setNewIsCurrent}
                    />
                    <span className="text-sm">
                      {newIsCurrent ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={handleAddTermSession} className="mt-4">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Term/Session
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-3">Existing Terms & Sessions</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {termSessions.map(ts => (
                      <TableRow key={ts.id}>
                        <TableCell className="font-medium">{ts.term}</TableCell>
                        <TableCell>{ts.session}</TableCell>
                        <TableCell>
                          {new Date(ts.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(ts.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {ts.isCurrent ? (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Current
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {ts.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTermSession(ts.id!)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {termSessions.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-gray-500 py-8"
                        >
                          No term/sessions configured. Add one above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutComponent>
  );
}
