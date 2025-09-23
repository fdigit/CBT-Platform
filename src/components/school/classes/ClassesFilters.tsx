'use client';

import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Card, CardContent } from '../../ui/card';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
// Define types locally instead of importing from page
interface ClassesFilters {
  search: string;
  academicYear: string;
  status: string;
}

interface ClassesFiltersProps {
  filters: ClassesFilters;
  onChange: (filters: Partial<ClassesFilters>) => void;
}

const STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
  {
    value: 'INACTIVE',
    label: 'Inactive',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-gray-100 text-gray-800' },
];

const ACADEMIC_YEARS = ['2024/2025', '2023/2024', '2022/2023', '2021/2022'];

export function ClassesFilters({ filters, onChange }: ClassesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (value: string) => {
    onChange({ search: value });
  };

  const handleFilterChange = (key: keyof ClassesFilters, value: any) => {
    onChange({ [key]: value });
  };

  const clearAllFilters = () => {
    onChange({
      search: '',
      academicYear: '',
      status: '',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(
    value => value !== '' && value !== null && value !== undefined
  ).length;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by class name, section, or room..."
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
            Filters
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

          {filters.academicYear && (
            <Badge variant="outline" className="flex items-center gap-1">
              Year: {filters.academicYear}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('academicYear', '')}
              />
            </Badge>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
