'use client';

import {
  BookOpen,
  GraduationCap,
  LogOut,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface TeacherTopNavbarProps {
  className?: string;
}

export function TeacherTopNavbar({ className }: TeacherTopNavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log(
        'Searching for:',
        searchQuery,
        'in context:',
        selectedContext
      );
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <header
      className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        {/* Teacher Info & Quick Context Switcher */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {session?.user?.name || 'Teacher Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">
                {session?.user?.school?.name || 'School Name'}
              </p>
            </div>
          </div>

          {/* Quick Context Switcher */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-gray-500">Context:</span>
            <Select value={selectedContext} onValueChange={setSelectedContext}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="ss1-a">SS 1A</SelectItem>
                <SelectItem value="ss2-b">SS 2B</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search students, classes, subjects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </form>
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-4">
          {/* Quick Action Buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/teacher/exams/create')}
              className="flex items-center space-x-1"
            >
              <BookOpen className="h-4 w-4" />
              <span>New Exam</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/teacher/assignments/create')}
              className="flex items-center space-x-1"
            >
              <Users className="h-4 w-4" />
              <span>Assignment</span>
            </Button>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="/avatars/teacher.png"
                    alt={session?.user?.name || ''}
                  />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0).toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || 'Teacher'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || 'teacher@school.com'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Mathematics & Physics Teacher
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/teacher/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/teacher/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
