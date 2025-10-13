'use client';

import type {
    SubjectsFilters,
    SubjectWithDetails,
    ViewMode,
} from '@/components/teacher/subjects';
import {
    BatchActionsBar,
    SubjectAnalyticsTab,
    SubjectsCardsView,
    SubjectsFiltersBar,
    SubjectsListView,
    SubjectsLoadingSkeleton,
    SubjectsTableView,
    ViewModeSwitcher,
} from '@/components/teacher/subjects';
import { TeacherDashboardLayout } from '@/components/teacher/TeacherDashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Plus, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '../../../hooks/use-toast';

export default function TeacherSubjects() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // View and tab state
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Data state
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<SubjectsFilters>({
    search: '',
    performance: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Selection state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }

    fetchTeacherSubjects();
  }, [session, status, router]);

  // Fetch subjects data
  const fetchTeacherSubjects = async () => {
    try {
      const response = await fetch('/api/teacher/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      } else {
        console.error('Failed to fetch teacher subjects');
        toast({
          title: 'Error',
          description: 'Failed to load subjects. Please try again.',
          variant: 'destructive',
        });
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while loading subjects.',
        variant: 'destructive',
      });
      setSubjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTeacherSubjects();
  };

  // Filter and sort subjects
  const getFilteredAndSortedSubjects = (): SubjectWithDetails[] => {
    let filtered = [...subjects];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        subject =>
          subject.name.toLowerCase().includes(searchLower) ||
          subject.code.toLowerCase().includes(searchLower)
      );
    }

    // Apply performance filter
    if (filters.performance === 'excellent') {
      filtered = filtered.filter(s => (s.averageScore || 0) >= 80);
    } else if (filters.performance === 'needs-attention') {
      filtered = filtered.filter(s => (s.averageScore || 0) < 70);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'students':
          aValue = a.totalStudents || 0;
          bValue = b.totalStudents || 0;
          break;
        case 'performance':
          aValue = a.averageScore || 0;
          bValue = b.averageScore || 0;
          break;
        case 'activity':
          aValue = a.pendingAssignments || 0;
          bValue = b.pendingAssignments || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const filteredSubjects = getFilteredAndSortedSubjects();

  // Handle subject action
  const handleSubjectAction = (action: string, subject: SubjectWithDetails) => {
    console.log('Subject action:', action, subject);

    switch (action) {
      case 'create-exam':
        router.push(`/teacher/exams/create?subject=${subject.id}`);
        break;
      case 'create-assignment':
        toast({
          title: 'Coming Soon',
          description: 'Assignment creation will be available soon!',
        });
        break;
      case 'create-lesson-plan':
        router.push(`/teacher/lesson-plans/create?subject=${subject.id}`);
        break;
      case 'view-analytics':
        setActiveTab('performance');
        break;
      case 'message-students':
        toast({
          title: 'Coming Soon',
          description: 'Messaging feature will be available soon!',
        });
        break;
      case 'export-report':
        toast({
          title: 'Exporting',
          description: `Generating report for ${subject.name}...`,
        });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Handle batch action
  const handleBatchAction = (action: string) => {
    console.log('Batch action:', action, selectedSubjects);

    toast({
      title: 'Action Completed',
      description: `${action} performed on ${selectedSubjects.length} subject(s)`,
    });

    // Clear selection after action
    setSelectedSubjects([]);
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <TeacherDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
              <p className="text-gray-600 mt-1">Loading your subjects...</p>
            </div>
          </div>
          <SubjectsLoadingSkeleton viewMode="cards" count={6} />
        </div>
      </TeacherDashboardLayout>
    );
  }

  // Unauthorized
  if (!session || session.user.role !== 'TEACHER') {
    return null;
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all your teaching subjects
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button onClick={() => toast({ title: 'Coming Soon', description: 'Resource management coming soon!' })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="flex-1 sm:flex-initial">
                <BookOpen className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex-1 sm:flex-initial">
                Performance
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1 sm:flex-initial">
                Resources
              </TabsTrigger>
            </TabsList>

            {/* View Mode Switcher (only for overview tab) */}
            {activeTab === 'overview' && (
              <ViewModeSwitcher
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Filters */}
            <SubjectsFiltersBar
              filters={filters}
              onFiltersChange={setFilters}
              resultsCount={filteredSubjects.length}
            />

            {/* Content based on view mode */}
            {refreshing ? (
              <SubjectsLoadingSkeleton viewMode={viewMode} count={6} />
            ) : viewMode === 'cards' ? (
              <SubjectsCardsView
                subjects={filteredSubjects}
                selectedSubjects={selectedSubjects}
                onSelectionChange={setSelectedSubjects}
                onAction={handleSubjectAction}
              />
            ) : viewMode === 'table' ? (
              <SubjectsTableView
                subjects={filteredSubjects}
                selectedSubjects={selectedSubjects}
                onSelectionChange={setSelectedSubjects}
                onAction={handleSubjectAction}
              />
            ) : (
              <SubjectsListView
                subjects={filteredSubjects}
                selectedSubjects={selectedSubjects}
                onSelectionChange={setSelectedSubjects}
                onAction={handleSubjectAction}
              />
            )}

            {/* Empty state */}
            {!refreshing && subjects.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No subjects assigned
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  You don&apos;t have any subjects assigned yet. Please contact
                  your administrator.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            {subjects.length > 0 ? (
              <SubjectAnalyticsTab subjects={subjects} />
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No data available
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Analytics will appear once you have subjects assigned.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Resources Coming Soon
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Subject resources and materials management will be available soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Batch Actions Bar */}
        <BatchActionsBar
          selectedCount={selectedSubjects.length}
          onClearSelection={() => setSelectedSubjects([])}
          onBatchAction={handleBatchAction}
        />
      </div>
    </TeacherDashboardLayout>
  );
}
