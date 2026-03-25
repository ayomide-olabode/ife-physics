'use client';

import * as React from 'react';
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

import { searchCoursesUniversal } from '@/server/queries/courseSearchUniversal';
import { useDebounce } from '@/hooks/useDebounce';

interface UniversalCourseAutocompleteProps {
  onSelect: (course: { id: string; code: string; title: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (val: string) => void;
}

export function UniversalCourseAutocomplete({
  onSelect,
  placeholder = 'Select or type a course code...',
  disabled,
  value,
  onChange,
}: UniversalCourseAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [results, setResults] = React.useState<Array<{ id: string; code: string; title: string }>>(
    [],
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    searchCoursesUniversal(debouncedSearch, 15)
      .then((res) => {
        if (active) {
          setResults(res);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  const displayValue = value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-start overflow-hidden"
        >
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type code or title..."
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
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
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
