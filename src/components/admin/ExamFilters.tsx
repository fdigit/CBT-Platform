'use client';

import { Calendar, Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface ExamFiltersProps {
  onFiltersChange: (filters: ExamFilters) => void;
  schools: Array<{ id: string; name: string }>;
  className?: string;
}

export interface ExamFilters {
  search: string;
  status: string;
  examType: string;
  schoolId: string;
  startDate: string;
  endDate: string;
}

const initialFilters: ExamFilters = {
  search: '',
  status: '',
  examType: '',
  schoolId: '',
  startDate: '',
  endDate: '',
};

export function ExamFilters({
  onFiltersChange,
  schools,
  className,
}: ExamFiltersProps) {
  const [filters, setFilters] = useState<ExamFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof ExamFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setIsExpanded(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card className={cn('mb-6', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by exam title or school name..."
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="flex items-center gap-2 text-gray-500"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Expanded Filters */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Status
                </label>
                <Select
                  value={filters.status}
                  onValueChange={value => updateFilter('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="PENDING">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Exam Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Exam Type
                </label>
                <Select
                  value={filters.examType}
                  onValueChange={value => updateFilter('examType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="OBJECTIVE">Objective</SelectItem>
                    <SelectItem value="THEORY">Theory</SelectItem>
                    <SelectItem value="CBT">CBT</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* School Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  School
                </label>
                <Select
                  value={filters.schoolId}
                  onValueChange={value => updateFilter('schoolId', value)}
                >
                  <SelectTrigger>
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

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Date Range
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={filters.startDate}
                      onChange={e => updateFilter('startDate', e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={filters.endDate}
                      onChange={e => updateFilter('endDate', e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
