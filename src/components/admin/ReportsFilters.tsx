'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { CalendarIcon, Download, RefreshCw, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export interface ReportsFilters {
  dateRange: string;
  schoolId?: string;
  role?: string;
  examType?: string;
  customDateFrom?: Date;
  customDateTo?: Date;
}

interface ReportsFiltersProps {
  filters: ReportsFilters;
  onFiltersChange: (filters: ReportsFilters) => void;
  schools: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
  loading?: boolean;
}

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'last90days', label: 'Last 90 days' },
  { value: 'last12months', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom Range' },
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admins' },
  { value: 'SCHOOL_ADMIN', label: 'School Admins' },
  { value: 'STUDENT', label: 'Students' },
];

const EXAM_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'ASSESSMENT', label: 'Assessment' },
  { value: 'EXAM', label: 'Exam' },
];

export function ReportsFilters({
  filters,
  onFiltersChange,
  schools,
  onRefresh,
  onExport,
  loading,
}: ReportsFiltersProps) {
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const handleFilterChange = (key: keyof ReportsFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };

    // Reset custom dates if not using custom range
    if (key === 'dateRange' && value !== 'custom') {
      newFilters.customDateFrom = undefined;
      newFilters.customDateTo = undefined;
      setShowCustomDatePicker(false);
    } else if (key === 'dateRange' && value === 'custom') {
      setShowCustomDatePicker(true);
    }

    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: 'last30days',
      schoolId: undefined,
      role: undefined,
      examType: undefined,
      customDateFrom: undefined,
      customDateTo: undefined,
    });
    setShowCustomDatePicker(false);
  };

  const activeFiltersCount = [
    filters.schoolId,
    filters.role && filters.role !== 'all',
    filters.examType && filters.examType !== 'all',
    filters.customDateFrom,
    filters.customDateTo,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center flex-1">
            {/* Date Range */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Date Range
              </label>
              <Select
                value={filters.dateRange}
                onValueChange={value => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[140px] justify-start text-left font-normal',
                        !filters.customDateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.customDateFrom ? (
                        format(filters.customDateFrom, 'MMM dd')
                      ) : (
                        <span>From date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.customDateFrom}
                      onSelect={date =>
                        handleFilterChange('customDateFrom', date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[140px] justify-start text-left font-normal',
                        !filters.customDateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.customDateTo ? (
                        format(filters.customDateTo, 'MMM dd')
                      ) : (
                        <span>To date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.customDateTo}
                      onSelect={date =>
                        handleFilterChange('customDateTo', date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* School Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                School
              </label>
              <Select
                value={filters.schoolId || 'all'}
                onValueChange={value =>
                  handleFilterChange(
                    'schoolId',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Schools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <Select
                value={filters.role || 'all'}
                onValueChange={value =>
                  handleFilterChange(
                    'role',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exam Type Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Exam Type
              </label>
              <Select
                value={filters.examType || 'all'}
                onValueChange={value =>
                  handleFilterChange(
                    'examType',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={cn('h-4 w-4 mr-2', loading && 'animate-spin')}
              />
              Refresh
            </Button>

            {/* Export Dropdown */}
            <div className="relative">
              <Select
                onValueChange={format =>
                  onExport(format as 'csv' | 'json' | 'pdf')
                }
              >
                <SelectTrigger className="w-[120px]">
                  <Download className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">Export CSV</SelectItem>
                  <SelectItem value="json">Export JSON</SelectItem>
                  <SelectItem value="pdf">Export PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {filters.schoolId && (
                <Badge variant="outline" className="flex items-center gap-1">
                  School:{' '}
                  {schools.find(s => s.id === filters.schoolId)?.name ||
                    'Unknown'}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('schoolId', undefined)}
                  />
                </Badge>
              )}
              {filters.role && filters.role !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Role:{' '}
                  {ROLE_OPTIONS.find(r => r.value === filters.role)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('role', undefined)}
                  />
                </Badge>
              )}
              {filters.examType && filters.examType !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Type:{' '}
                  {
                    EXAM_TYPE_OPTIONS.find(t => t.value === filters.examType)
                      ?.label
                  }
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('examType', undefined)}
                  />
                </Badge>
              )}
              {filters.customDateFrom && (
                <Badge variant="outline" className="flex items-center gap-1">
                  From: {format(filters.customDateFrom, 'MMM dd, yyyy')}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      handleFilterChange('customDateFrom', undefined)
                    }
                  />
                </Badge>
              )}
              {filters.customDateTo && (
                <Badge variant="outline" className="flex items-center gap-1">
                  To: {format(filters.customDateTo, 'MMM dd, yyyy')}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      handleFilterChange('customDateTo', undefined)
                    }
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
