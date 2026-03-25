'use client';

import * as React from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { searchStaffAuthors, type StaffAuthorResult } from '@/server/queries/staffAuthorLookup';
import { formatPersonName } from '@/lib/name';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { AuthorObject } from '@/lib/researchOutputTypes';

interface StaffAuthorAutocompleteProps {
  onSelect: (author: AuthorObject) => void;
  disabled?: boolean;
}

export function StaffAuthorAutocomplete({ onSelect, disabled }: StaffAuthorAutocompleteProps) {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<StaffAuthorResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    let active = true;

    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    searchStaffAuthors(debouncedSearch, 10)
      .then((res) => {
        if (active) {
          setResults(res);
          setOpen(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(staff: StaffAuthorResult) {
    onSelect({
      staffId: staff.id,
      given_name: staff.firstName || '',
      middle_name: staff.middleName || undefined,
      family_name: staff.lastName || '',
    });
    setSearch('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          placeholder="Search staff by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value.length >= 2) setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          disabled={disabled}
          className="pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {results.map((staff) => {
            const displayName =
              formatPersonName({
                firstName: staff.firstName,
                middleName: staff.middleName,
                lastName: staff.lastName,
              }) || staff.institutionalEmail;
            return (
              <li key={staff.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start rounded-sm px-3 py-2 text-left text-base hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => handleSelect(staff)}
                >
                  <span className="font-medium">{displayName}</span>
                  <span className="text-sm text-muted-foreground">{staff.institutionalEmail}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && !loading && search.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-base text-muted-foreground shadow-md">
          No staff found
        </div>
      )}
    </div>
  );
}
