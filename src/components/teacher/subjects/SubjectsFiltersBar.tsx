'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search, SortAsc, X } from 'lucide-react';
import { useState } from 'react';

export interface SubjectsFilters {
  search: string;
  performance: 'all' | 'excellent' | 'needs-attention';
  sortBy: 'name' | 'students' | 'performance' | 'activity';
  sortOrder: 'asc' | 'desc';
}

interface SubjectsFiltersBarProps {
  filters: SubjectsFilters;
  onFiltersChange: (filters: SubjectsFilters) => void;
  resultsCount?: number;
}

export function SubjectsFiltersBar({
  filters,
  onFiltersChange,
  resultsCount,
}: SubjectsFiltersBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handlePerformanceChange = (value: SubjectsFilters['performance']) => {
    onFiltersChange({ ...filters, performance: value });
  };

  const handleSortChange = (value: SubjectsFilters['sortBy']) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const toggleSortOrder = () => {
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      performance: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.performance !== 'all' ||
    filters.sortBy !== 'name' ||
    filters.sortOrder !== 'asc';

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search !== '') count++;
    if (filters.performance !== 'all') count++;
    if (filters.sortBy !== 'name' || filters.sortOrder !== 'asc') count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search subjects by name or code..."
            value={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
            aria-label="Search subjects"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Toggle Button (Mobile) */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600"
            >
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>

        {/* Filter Controls (Desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <Select
            value={filters.performance}
            onValueChange={handlePerformanceChange}
          >
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="excellent">High Performing (≥80%)</SelectItem>
              <SelectItem value="needs-attention">
                Needs Attention (&lt;70%)
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="students">Sort by Students</SelectItem>
              <SelectItem value="performance">Sort by Performance</SelectItem>
              <SelectItem value="activity">Sort by Activity</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            aria-label={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <SortAsc
              className={`h-4 w-4 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showFilters && (
        <div className="sm:hidden space-y-3 p-4 bg-gray-50 rounded-lg">
          <Select
            value={filters.performance}
            onValueChange={handlePerformanceChange}
          >
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="excellent">High Performing (≥80%)</SelectItem>
              <SelectItem value="needs-attention">
                Needs Attention (&lt;70%)
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="students">Sort by Students</SelectItem>
              <SelectItem value="performance">Sort by Performance</SelectItem>
              <SelectItem value="activity">Sort by Activity</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={toggleSortOrder}
            className="w-full"
          >
            <SortAsc
              className={`h-4 w-4 mr-2 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`}
            />
            {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>
      )}

      {/* Active Filters and Results */}
      <div className="flex flex-wrap items-center gap-2">
        {resultsCount !== undefined && (
          <span className="text-sm text-gray-600">
            {resultsCount} {resultsCount === 1 ? 'subject' : 'subjects'} found
          </span>
        )}

        {hasActiveFilters && (
          <>
            <span className="text-sm text-gray-400">•</span>
            {filters.performance !== 'all' && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-gray-300"
                onClick={() => handlePerformanceChange('all')}
              >
                {filters.performance === 'excellent'
                  ? 'High Performing'
                  : 'Needs Attention'}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {(filters.sortBy !== 'name' || filters.sortOrder !== 'asc') && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-gray-300"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    sortBy: 'name',
                    sortOrder: 'asc',
                  })
                }
              >
                Sort: {filters.sortBy} ({filters.sortOrder})
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 text-xs"
            >
              Clear all
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
