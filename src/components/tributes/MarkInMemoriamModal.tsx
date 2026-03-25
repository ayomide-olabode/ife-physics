'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { YearGroupedSelect } from '@/components/forms/YearGroupedSelect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { searchStaff } from '@/server/queries/staffSearch';
import { formatPersonName } from '@/lib/name';
import { toastError, toastSuccess } from '@/lib/toast';
import { markStaffInMemoriam } from '@/server/actions/tributesAdmin';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

type StaffSearchResult = {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  institutionalEmail: string;
};

const MIN_BIRTH_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();

export function MarkInMemoriamModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StaffSearchResult[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [yearOfBirth, setYearOfBirth] = useState<number | undefined>(undefined);
  const [dateOfDeath, setDateOfDeath] = useState('');

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length < 2) return;

    setIsSearching(true);
    setHasSearched(false);
    try {
      const results = await searchStaff({ q: searchQuery.trim() });
      setSearchResults(results);
      setHasSearched(true);
    } catch {
      toastError('Failed to search staff.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedStaffId || !dateOfDeath) return;

    setIsSubmitting(true);
    try {
      const result = await markStaffInMemoriam({
        staffId: selectedStaffId,
        yearOfBirth: typeof yearOfBirth === 'number' ? String(yearOfBirth) : undefined,
        dateOfDeath,
      });

      if (result.error) {
        toastError(result.error);
        setIsSubmitting(false);
        return;
      }

      toastSuccess('Staff marked as in memoriam.');
      setOpen(false);
      resetForm();
      router.push(`/dashboard/content/tributes/${selectedStaffId}`);
      router.refresh();
    } catch {
      toastError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStaffId('');
    setIsSearching(false);
    setHasSearched(false);
    setYearOfBirth(undefined);
    setDateOfDeath('');
    setIsSubmitting(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mark Staff as In Memoriam</DialogTitle>
          <DialogDescription>Select a staff member and capture memorial details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <FieldLabel htmlFor="staffSearch">Staff</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="staffSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSearch(e);
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => void handleSearch(e)}
                disabled={isSearching || searchQuery.trim().length < 2}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {!hasSearched && !isSearching && (
              <p className="text-base text-muted-foreground">Type at least 2 characters to search.</p>
            )}

            {hasSearched && searchResults.length === 0 && (
              <p className="text-base text-muted-foreground">No staff found.</p>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
                {searchResults.map((staff) => (
                  <label
                    key={staff.id}
                    className={`flex cursor-pointer items-start space-x-3 rounded-md border p-3 transition-colors ${
                      selectedStaffId === staff.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex h-5 items-center">
                      <input
                        type="radio"
                        name="staffSelection"
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
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
                        }) || staff.institutionalEmail}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {staff.institutionalEmail}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel htmlFor="yearOfBirth">Year of Birth</FieldLabel>
              <YearGroupedSelect
                id="yearOfBirth"
                value={yearOfBirth}
                onChange={setYearOfBirth}
                minYear={MIN_BIRTH_YEAR}
                maxYear={CURRENT_YEAR}
                placeholder="Select year"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="dateOfDeath">Date of Death</FieldLabel>
              <Input
                id="dateOfDeath"
                type="date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedStaffId || !dateOfDeath}>
              {isSubmitting ? 'Saving...' : 'Mark as In Memoriam'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
