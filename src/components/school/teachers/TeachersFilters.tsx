'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';
import { TeachersFilters as FiltersType } from '@/app/school/teachers/page';

interface TeachersFiltersProps {
  filters: FiltersType;
  onChange: (filters: Partial<FiltersType>) => void;
}

export function TeachersFilters({ filters, onChange }: TeachersFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hireDateFrom, setHireDateFrom] = useState<Date>();
  const [hireDateTo, setHireDateTo] = useState<Date>();
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Academic years (you might want to fetch these from an API)
  const academicYears = [
    '2024/2025',
    '2023/2024',
    '2022/2023',
    '2021/2022',
    '2020/2021',
  ];

  // Sample subjects (you might want to fetch these from an API)
  const subjects = [
    'Mathematics',
    'English Language',
    'Physics',
    'Chemistry',
    'Biology',
    'Government',
    'Economics',
    'Literature',
    'Geography',
    'History',
    'Computer Science',
    'Agricultural Science',
    'Technical Drawing',
    'Further Mathematics',
    'French',
    'Yoruba',
    'Igbo',
    'Hausa',
  ];

  // Sample classes (you might want to fetch these from an API)
  const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];

  const roles = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'adviser', label: 'Class Adviser' },
    { value: 'admin_staff', label: 'Admin Staff' },
  ];

  const statuses = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'TERMINATED', label: 'Retired' },
  ];

  const genders = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
  ];

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.search) count++;
    if (filters.academicYear) count++;
    if (filters.subjects) count++;
    if (filters.classes) count++;
    if (filters.role) count++;
    if (filters.status) count++;
    if (filters.hireDateFrom) count++;
    if (filters.hireDateTo) count++;
    if (filters.gender) count++;

    setActiveFiltersCount(count);
  }, [filters]);

  const handleClearAllFilters = () => {
    onChange({
      search: '',
      academicYear: '',
      subjects: '',
      classes: '',
      role: '',
      status: '',
      hireDateFrom: '',
      hireDateTo: '',
      gender: '',
    });
    setHireDateFrom(undefined);
    setHireDateTo(undefined);
  };

  const handleDateChange = (type: 'from' | 'to', date: Date | undefined) => {
    if (type === 'from') {
      setHireDateFrom(date);
      onChange({ hireDateFrom: date ? format(date, 'yyyy-MM-dd') : '' });
    } else {
      setHireDateTo(date);
      onChange({ hireDateTo: date ? format(date, 'yyyy-MM-dd') : '' });
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>Search & Filter Teachers</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear All</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isExpanded ? 'Hide Filters' : 'Show Filters'}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Global Search - Always Visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, teacher ID, email, or phone..."
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            className="pl-10 pr-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ search: '' })}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            {/* Academic Year */}
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select
                value={filters.academicYear}
                onValueChange={value => onChange({ academicYear: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subjects">Subject</Label>
              <Select
                value={filters.subjects}
                onValueChange={value => onChange({ subjects: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class */}
            <div className="space-y-2">
              <Label htmlFor="classes">Class/Grade</Label>
              <Select
                value={filters.classes}
                onValueChange={value => onChange({ classes: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={filters.role}
                onValueChange={value => onChange({ role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={value => onChange({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={filters.gender}
                onValueChange={value => onChange({ gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genders</SelectItem>
                  {genders.map(gender => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hire Date From */}
            <div className="space-y-2">
              <Label>Employment Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !hireDateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {hireDateFrom ? format(hireDateFrom, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={hireDateFrom}
                    onSelect={date => handleDateChange('from', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Hire Date To */}
            <div className="space-y-2">
              <Label>Employment Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !hireDateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {hireDateTo ? format(hireDateTo, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={hireDateTo}
                    onSelect={date => handleDateChange('to', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
            {filters.search && (
              <Badge
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>Search: &quot;{filters.search}&quot;</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onChange({ search: '' })}
                />
              </Badge>
            )}
            {filters.academicYear && (
              <Badge
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>Year: {filters.academicYear}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onChange({ academicYear: '' })}
                />
              </Badge>
            )}
            {filters.subjects && (
              <Badge
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>Subject: {filters.subjects}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onChange({ subjects: '' })}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>
                  Status:{' '}
                  {statuses.find(s => s.value === filters.status)?.label}
                </span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onChange({ status: '' })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
