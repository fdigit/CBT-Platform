'use client';

import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Calendar } from '../../ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Card, CardContent } from '../../ui/card';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
// Define the filters type locally since it's not exported from the page
interface StudentsFilters {
  search: string;
  class: string;
  section: string;
  gender: string;
  status: string;
  academicYear: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  tags: string[];
}

interface StudentsFiltersProps {
  filters: StudentsFilters;
  onChange: (filters: Partial<StudentsFilters>) => void;
}

const CLASSES = [
  'JSS 1',
  'JSS 2',
  'JSS 3',
  'SS 1',
  'SS 2',
  'SS 3',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  {
    value: 'GRADUATED',
    label: 'Graduated',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'PENDING',
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { value: 'ALUMNI', label: 'Alumni', color: 'bg-purple-100 text-purple-800' },
];

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];

const ACADEMIC_YEARS = ['2024/2025', '2023/2024', '2022/2023', '2021/2022'];

const AVAILABLE_TAGS = [
  'Scholarship',
  'Boarding',
  'Day',
  'Special Needs',
  'Sports',
  'Arts',
  'Science',
];

export function StudentsFilters({ filters, onChange }: StudentsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.dateRange.from,
    to: filters.dateRange.to,
  });

  const handleSearchChange = (value: string) => {
    onChange({ search: value });
  };

  const handleFilterChange = (key: keyof StudentsFilters, value: any) => {
    onChange({ [key]: value });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    onChange({ dateRange: range });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onChange({ tags: newTags });
  };

  const clearAllFilters = () => {
    onChange({
      search: '',
      class: '',
      section: '',
      gender: '',
      status: '',
      academicYear: '',
      dateRange: {},
      tags: [],
    });
    setDateRange({});
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== null);
    }
    return value !== '' && value !== null && value !== undefined;
  }).length;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, admission number, class, or parent phone..."
            value={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}

          {/* Active Filter Tags */}
          {filters.status && (
            <Badge variant="outline" className="flex items-center gap-1">
              Status: {STATUSES.find(s => s.value === filters.status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('status', '')}
              />
            </Badge>
          )}

          {filters.class && (
            <Badge variant="outline" className="flex items-center gap-1">
              Class: {filters.class}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('class', '')}
              />
            </Badge>
          )}

          {filters.gender && (
            <Badge variant="outline" className="flex items-center gap-1">
              Gender: {GENDERS.find(g => g.value === filters.gender)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('gender', '')}
              />
            </Badge>
          )}

          {filters.tags.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className="flex items-center gap-1"
            >
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Academic Year */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select
                value={filters.academicYear}
                onValueChange={value =>
                  handleFilterChange('academicYear', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {ACADEMIC_YEARS.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select
                value={filters.class}
                onValueChange={value => handleFilterChange('class', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {CLASSES.map(cls => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select
                value={filters.section}
                onValueChange={value => handleFilterChange('section', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {SECTIONS.map(section => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select
                value={filters.gender}
                onValueChange={value => handleFilterChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genders</SelectItem>
                  {GENDERS.map(gender => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={value => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${status.color}`}
                      ></span>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      'Pick a date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={range => handleDateRangeChange(range || {})}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Tags */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <Button
                    key={tag}
                    variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
