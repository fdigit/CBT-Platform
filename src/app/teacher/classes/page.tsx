'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TeacherDashboardLayout } from '../../../components/teacher/TeacherDashboardLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Edit,
  MessageSquare,
  BarChart3,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Trophy,
  ClipboardList,
} from 'lucide-react';

interface ClassInfo {
  id: string;
  name: string;
  section: string;
  subject: string;
  studentCount: number;
  averageScore: number;
  attendanceRate: number;
  nextLesson: string;
  status: 'active' | 'inactive';
  room?: string;
  schedule: {
    day: string;
    time: string;
  }[];
}

interface StudentInfo {
  id: string;
  name: string;
  regNumber: string;
  avatar?: string;
  lastSeen: string;
  currentGrade: number;
  attendance: number;
}

export default function TeacherClasses() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classStudents, setClassStudents] = useState<StudentInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'TEACHER') {
      router.push('/auth/signin');
      return;
    }

    fetchTeacherClasses();
  }, [session, status, router]);

  const fetchTeacherClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(
          data.classes.map((cls: any) => ({
            ...cls,
            status: 'active',
            subject: cls.subjects.map((s: any) => s.name).join(', '),
            schedule: [
              { day: 'Monday', time: '09:00 AM' },
              { day: 'Wednesday', time: '11:00 AM' },
              { day: 'Friday', time: '02:00 PM' },
            ], // Mock schedule - in real app, this would come from timetable data
          }))
        );
      } else {
        console.error('Failed to fetch teacher classes');
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      setClasses([]);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    // Mock data - replace with actual API call
    setClassStudents([
      {
        id: '1',
        name: 'John Doe',
        regNumber: 'SS1A/001',
        lastSeen: '2 hours ago',
        currentGrade: 85,
        attendance: 95,
      },
      {
        id: '2',
        name: 'Jane Smith',
        regNumber: 'SS1A/002',
        lastSeen: '1 day ago',
        currentGrade: 92,
        attendance: 98,
      },
      {
        id: '3',
        name: 'Mike Johnson',
        regNumber: 'SS1A/003',
        lastSeen: '5 hours ago',
        currentGrade: 78,
        attendance: 89,
      },
    ]);
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.section.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || cls.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const toggleClassExpanded = (classId: string) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
      setSelectedClass(null);
      setClassStudents([]);
    } else {
      setExpandedClass(classId);
      setSelectedClass(classId);
      fetchClassStudents(classId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
        );
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-600 mt-1">
              Manage your classes and view student progress
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button>
              <GraduationCap className="h-4 w-4 mr-2" />
              Class Overview
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search classes, subjects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Classes Grid */}
        <div className="space-y-4">
          {filteredClasses.map(classInfo => (
            <Card key={classInfo.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleClassExpanded(classInfo.id)}
                      className="p-0 h-auto"
                    >
                      {expandedClass === classInfo.id ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-xl">
                        {classInfo.name}
                        {classInfo.section} - {classInfo.subject}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {classInfo.room} • Next: {classInfo.nextLesson}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(classInfo.status)}
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Class Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {classInfo.studentCount}
                    </div>
                    <div className="text-sm text-gray-600">Students</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(classInfo.averageScore)}`}
                    >
                      {classInfo.averageScore}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {classInfo.attendanceRate}%
                    </div>
                    <div className="text-sm text-gray-600">Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {classInfo.schedule.length}
                    </div>
                    <div className="text-sm text-gray-600">Weekly Classes</div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Weekly Schedule
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {classInfo.schedule.map((schedule, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {schedule.day} - {schedule.time}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <ClipboardList className="h-4 w-4 mr-1" />
                    Attendance
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trophy className="h-4 w-4 mr-1" />
                    Create Exam
                  </Button>
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Assignment
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message Students
                  </Button>
                </div>

                {/* Expanded Class Details */}
                {expandedClass === classInfo.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Class Students
                    </h4>
                    <div className="space-y-3">
                      {classStudents.map(student => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={student.avatar}
                                alt={student.name}
                              />
                              <AvatarFallback>
                                {student.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {student.regNumber}
                              </p>
                              <p className="text-xs text-gray-500">
                                Last seen: {student.lastSeen}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div
                                className={`text-lg font-bold ${getScoreColor(student.currentGrade)}`}
                              >
                                {student.currentGrade}%
                              </div>
                              <div className="text-xs text-gray-600">Grade</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {student.attendance}%
                              </div>
                              <div className="text-xs text-gray-600">
                                Attendance
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No classes found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : "You don't have any classes assigned yet."}
            </p>
          </div>
        )}
      </div>
    </TeacherDashboardLayout>
  );
}
