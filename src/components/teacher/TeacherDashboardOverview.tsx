'use client';

import {
  AlertCircle,
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { StatsCard } from './StatsCard';

interface TeacherStats {
  totalStudents: number;
  totalClasses: number;
  activeExams: number;
  pendingTasks: number;
  classAverageScore: number;
  attendanceRate: number;
}

interface TodayScheduleItem {
  id: string;
  type: 'lesson' | 'exam' | 'assignment';
  title: string;
  class: string;
  subject: string;
  time: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface PendingTask {
  id: string;
  type: 'grading' | 'lesson_plan' | 'assignment_review';
  title: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface StudentActivity {
  id: string;
  studentName: string;
  action: string;
  subject: string;
  time: string;
  avatar?: string;
}

export function TeacherDashboardOverview() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [selectedContext, setSelectedContext] = useState('all');
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleItem[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<StudentActivity[]>([]);

  useEffect(() => {
    // Fetch teacher stats
    fetchTeacherStats();
    fetchTodaySchedule();
    fetchPendingTasks();
    fetchRecentActivity();
  }, [selectedContext]);

  const fetchTeacherStats = async () => {
    try {
      // Fetch both classes and subjects data
      const [classesResponse, subjectsResponse] = await Promise.all([
        fetch('/api/teacher/classes'),
        fetch('/api/teacher/subjects'),
      ]);

      if (classesResponse.ok && subjectsResponse.ok) {
        const classesData = await classesResponse.json();
        const subjectsData = await subjectsResponse.json();

        const totalStudents = classesData.summary?.totalStudents || 0;
        const totalClasses = classesData.summary?.totalClasses || 0;
        const pendingTasks =
          subjectsData.subjects?.reduce(
            (sum: number, subject: any) =>
              sum + (subject.pendingAssignments || 0),
            0
          ) || 0;
        const classAverageScore = subjectsData.summary?.averageScore || 0;
        const attendanceRate = 0; // TODO: Replace with actual attendance API

        setStats({
          totalStudents,
          totalClasses,
          activeExams: 0, // TODO: Replace with actual exams API
          pendingTasks,
          classAverageScore,
          attendanceRate,
        });
      } else {
        // Fallback to empty data if API fails
        setStats({
          totalStudents: 0,
          totalClasses: 0,
          activeExams: 0,
          pendingTasks: 0,
          classAverageScore: 0,
          attendanceRate: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      // Fallback to empty data
      setStats({
        totalStudents: 0,
        totalClasses: 0,
        activeExams: 0,
        pendingTasks: 0,
        classAverageScore: 0,
        attendanceRate: 0,
      });
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      // TODO: Replace with actual API call to fetch today's schedule
      // For now, set empty array
      setTodaySchedule([]);
    } catch (error) {
      console.error("Error fetching today's schedule:", error);
      setTodaySchedule([]);
    }
  };

  const fetchPendingTasks = async () => {
    try {
      // TODO: Replace with actual API call to fetch pending tasks
      // For now, set empty array
      setPendingTasks([]);
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      setPendingTasks([]);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // TODO: Replace with actual API call to fetch recent activity
      // For now, set empty array
      setRecentActivity([]);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Upcoming
          </Badge>
        );
      case 'ongoing':
        return (
          <Badge variant="default" className="bg-green-600">
            Ongoing
          </Badge>
        );
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            Medium
          </Badge>
        );
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'grading':
        return <ClipboardList className="h-4 w-4" />;
      case 'lesson_plan':
        return <FileText className="h-4 w-4" />;
      case 'assignment_review':
        return <Eye className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Context Selector */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Teacher Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back! Here&apos;s your teaching overview.
          </p>
        </div>
        <div className="flex items-center">
          <Select value={selectedContext} onValueChange={setSelectedContext}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select class/subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes & Subjects</SelectItem>
              <SelectItem value="ss1-a">SS 1A</SelectItem>
              <SelectItem value="ss2-a">SS 2A</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          description="Across all classes"
          icon={Users}
          trend={{
            value: 5,
            label: 'from last month',
            isPositive: true,
          }}
        />
        <StatsCard
          title="My Classes"
          value={stats.totalClasses}
          description="Active classes"
          icon={BookOpen}
        />
        <StatsCard
          title="Active Exams"
          value={stats.activeExams}
          description="Currently running"
          icon={Trophy}
        />
        <StatsCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          description="Require attention"
          icon={ClipboardList}
          trend={{
            value: -2,
            label: 'from yesterday',
            isPositive: true,
          }}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
              <span>Class Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.classAverageScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${stats.classAverageScore}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Attendance Rate</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.attendanceRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${stats.attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <Button className="flex flex-col items-center space-y-1 md:space-y-2 h-auto py-3 md:py-4">
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Create Exam</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center space-y-1 md:space-y-2 h-auto py-3 md:py-4"
              >
                <ClipboardList className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Assignment</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center space-y-1 md:space-y-2 h-auto py-3 md:py-4"
              >
                <FileText className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Lesson Plan</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center space-y-1 md:space-y-2 h-auto py-3 md:py-4"
              >
                <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Message</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Widgets */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              <span>Today&apos;s Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {todaySchedule.map(item => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.class} • {item.subject}
                    </p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
              <span>Pending Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {pendingTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start space-x-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getTaskIcon(task.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {task.dueDate}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getPriorityBadge(task.priority)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Student Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={activity.avatar}
                      alt={activity.studentName}
                    />
                    <AvatarFallback>
                      {activity.studentName
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.studentName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.action} - {activity.subject}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
