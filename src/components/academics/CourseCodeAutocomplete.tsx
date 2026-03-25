'use client';

import * as React from 'react';
import { ProgrammeCode } from '@prisma/client';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { lookupCourseByCode as lookupPgCourseByCode } from '@/server/actions/postgraduateCourses';
import { lookupCourseByCode as lookupUgCourseByCode } from '@/server/actions/undergraduateCourses';
import { useDebounce } from '@/hooks/useDebounce';

interface CourseCodeAutocompleteProps {
  programmeCode: ProgrammeCode;
  level: 'UNDERGRADUATE' | 'POSTGRADUATE';
  onSelect: (course: { id: string; code: string; title: string }) => void;
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (val: string) => void;
}

export function CourseCodeAutocomplete({
  programmeCode,
  level,
  onSelect,
  excludeIds = [],
  placeholder = 'Select or type a course code...',
  disabled,
  value,
  onChange,
}: CourseCodeAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [results, setResults] = React.useState<Array<{ id: string; code: string; title: string }>>(
    [],
  );
  const [loading, setLoading] = React.useState(false);

  const excludeIdsKey = excludeIds.join(',');

  React.useEffect(() => {
    let active = true;
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    setLoading(true);

    const lookupPromise =
      level === 'UNDERGRADUATE'
        ? lookupUgCourseByCode({ programmeCode, codePrefix: debouncedSearch })
        : lookupPgCourseByCode({ programmeCode, codePrefix: debouncedSearch });

    lookupPromise
      .then((res) => {
        if (active) {
          // Filter out already selected courses for the dropdown if needed
          const filtered = res.filter((r) => !excludeIds.includes(r.id));
          setResults(filtered);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, programmeCode, level, excludeIdsKey]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-start"
        >
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type code (e.g. PHY701)..."
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              if (onChange) onChange(val.toUpperCase());
            }}
          />
          <CommandList>
            <CommandEmpty>
              {loading
                ? 'Searching...'
                : search.length < 2
                  ? 'Type at least 2 chars'
                  : 'No exact matches found.'}
            </CommandEmpty>
            <CommandGroup>
              {results.map((course) => (
                <CommandItem
                  key={course.id}
                  value={course.code}
                  onSelect={(currentValue) => {
                    const upperVal = currentValue.toUpperCase();
                    if (onChange) onChange(upperVal);
                    onSelect(course);
                    setOpen(false);
                    setSearch(''); // clear search on select for continuous adding
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === course.code ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {course.code} - {course.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
