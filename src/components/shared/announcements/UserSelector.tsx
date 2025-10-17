'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { UserListItem, UserListResponse } from '@/types/models';
import { Search, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface UserSelectorProps {
  role: 'TEACHER' | 'STUDENT';
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  fetchUrl: string;
  filterOptions?: {
    classId?: string;
    subjectId?: string;
  };
  placeholder?: string;
}

export function UserSelector({
  role,
  selectedIds,
  onSelectionChange,
  fetchUrl,
  filterOptions,
  placeholder = 'Search users...',
}: UserSelectorProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const currentPage = reset ? 1 : page;

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          ...(search && { search }),
          ...(role && { role }),
          ...(filterOptions?.classId && { classId: filterOptions.classId }),
          ...(filterOptions?.subjectId && {
            subjectId: filterOptions.subjectId,
          }),
        });

        const response = await fetch(`${fetchUrl}?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data: UserListResponse = await response.json();

        if (reset) {
          setUsers(data.users);
          setPage(2);
        } else {
          setUsers(prev => [...prev, ...data.users]);
          setPage(prev => prev + 1);
        }

        setHasMore(data.pagination.page < data.pagination.pages);
        setTotal(data.pagination.total);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    },
    [fetchUrl, search, page, role, filterOptions]
  );

  // Initial load
  useEffect(() => {
    fetchUsers(true);
  }, [fetchUrl, role, filterOptions]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        fetchUsers(true);
      } else {
        fetchUsers(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectAll = () => {
    const allVisibleIds = users.map(user => user.id);
    const allSelected = allVisibleIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all visible users
      const newSelection = selectedIds.filter(
        id => !allVisibleIds.includes(id)
      );
      onSelectionChange(newSelection);
    } else {
      // Select all visible users
      const combinedIds = [...selectedIds, ...allVisibleIds];
      const uniqueIds = combinedIds.filter(
        (id, index) => combinedIds.indexOf(id) === index
      );
      onSelectionChange(uniqueIds);
    }
  };

  const handleUserToggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onSelectionChange(selectedIds.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedIds, userId]);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchUsers(false);
    }
  };

  const allVisibleSelected =
    users.length > 0 && users.every(user => selectedIds.includes(user.id));
  const someVisibleSelected = users.some(user => selectedIds.includes(user.id));

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Select All */}
      {users.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
          <Checkbox
            id="select-all"
            checked={allVisibleSelected}
            ref={el => {
              if (el) {
                // Cast to HTMLInputElement to access indeterminate property
                const inputEl = el as any;
                inputEl.indeterminate =
                  someVisibleSelected && !allVisibleSelected;
              }
            }}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all" className="text-sm font-medium">
            Select All ({selectedIds.length} selected)
          </Label>
        </div>
      )}

      {/* Users List */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
        {loading && users.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No {role.toLowerCase()}s found</p>
            {search && <p className="text-sm">Try adjusting your search</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map(user => (
              <div key={user.id} className="p-3 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={user.id}
                    checked={selectedIds.includes(user.id)}
                    onCheckedChange={() => handleUserToggle(user.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={user.id}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {user.name}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    {user.className && (
                      <p className="text-xs text-gray-400">
                        {user.className}
                        {user.section && ` - ${user.section}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && users.length > 0 && (
          <div className="p-3 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loading}
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{selectedIds.length}</strong> {role.toLowerCase()}
            {selectedIds.length === 1 ? '' : 's'} selected
          </p>
        </div>
      )}
    </div>
  );
}
