'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Checkbox } from '@/components/ui/checkbox';
import { searchStaff } from '@/server/queries/staffSearch';
import { createUser } from '@/server/actions/adminUsers';
import { toastSuccess, toastError } from '@/lib/toast';
import { formatPersonName } from '@/lib/name';

export function CreateUserForm() {
  const router = useRouter();

  // Form state
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      firstName: string | null;
      middleName: string | null;
      lastName: string | null;
      institutionalEmail: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 2) return;

    setIsSearching(true);
    setHasSearched(false);
    try {
      const results = await searchStaff({ q: searchQuery });
      setSearchResults(results);
      setHasSearched(true);
    } catch {
      toastError('Failed to search staff.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedStaffId) {
      toastError('Please select a staff member.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUser({
        staffId: selectedStaffId,
        isSuperAdmin,
      });

      if (res.error) {
        toastError(res.error);
        setIsSubmitting(false);
      } else if (res.success && res.userId) {
        toastSuccess('User created successfully.');
        router.push(`/dashboard/admin/users/${res.userId}`);
      }
    } catch {
      toastError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="space-y-4 rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-medium">1. Select Staff Member</h3>
        <p className="text-base text-muted-foreground">
          Users must be mapped to an existing staff record. Search by name or email.
        </p>

        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="E.g., John Doe"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || searchQuery.length < 2}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {!hasSearched && !isSearching && (
          <p className="mt-2 text-base text-muted-foreground">Type to search by name or email.</p>
        )}

        {hasSearched && searchResults.length === 0 && (
          <p className="mt-2 text-base text-muted-foreground">No staff found.</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2 border rounded-md p-2 max-h-60 overflow-y-auto">
            {searchResults.map((staff) => (
              <label
                key={staff.id}
                className={`flex items-start space-x-3 p-3 rounded-md cursor-pointer border transition-colors ${
                  selectedStaffId === staff.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="staffSelection"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    checked={selectedStaffId === staff.id}
                    onChange={() => setSelectedStaffId(staff.id)}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-medium">
                    {formatPersonName({
                      firstName: staff.firstName,
                      middleName: staff.middleName,
                      lastName: staff.lastName,
                    })}
                  </span>
                  <span className="text-sm text-muted-foreground">{staff.institutionalEmail}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-medium">2. Global Permissions</h3>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="superadmin"
            checked={isSuperAdmin}
            onCheckedChange={(checked) => setIsSuperAdmin(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <FieldLabel htmlFor="superadmin" className="font-medium">
              Grant Super Admin Access
            </FieldLabel>
            <p className="text-base text-muted-foreground">
              Super Admins have unrestricted access to all dashboard modules and configurations.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedStaffId}>
          {isSubmitting ? 'Creating User...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
