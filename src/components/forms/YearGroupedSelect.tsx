'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FieldLabel } from '@/components/forms/FieldLabel';

type YearGroupedSelectProps = {
  value?: number;
  onChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  label?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
};

type DecadeBucket = {
  key: number;
  label: string;
  years: number[];
};

function buildDecades(minYear: number, maxYear: number): DecadeBucket[] {
  const firstDecade = Math.floor(minYear / 10) * 10;
  const lastDecade = Math.floor(maxYear / 10) * 10;
  const buckets: DecadeBucket[] = [];

  for (let decadeStart = lastDecade; decadeStart >= firstDecade; decadeStart -= 10) {
    const decadeEnd = decadeStart + 9;
    const years: number[] = [];
    for (let year = Math.max(minYear, decadeStart); year <= Math.min(maxYear, decadeEnd); year += 1) {
      years.push(year);
    }

    if (years.length > 0) {
      buckets.push({
        key: decadeStart,
        label: `${decadeStart}-${decadeEnd}`,
        years,
      });
    }
  }

  return buckets;
}

export function YearGroupedSelect({
  value,
  onChange,
  minYear = 1960,
  maxYear = new Date().getFullYear(),
  label,
  required = false,
  placeholder = 'Year',
  id,
  disabled = false,
}: YearGroupedSelectProps) {
  const decades = useMemo(() => buildDecades(minYear, maxYear), [minYear, maxYear]);
  const [open, setOpen] = useState(false);
  const [expandedDecade, setExpandedDecade] = useState<number | null>(
    value ? Math.floor(value / 10) * 10 : (decades[0]?.key ?? null),
  );

  const selectedYear =
    typeof value === 'number' && value >= minYear && value <= maxYear ? value : undefined;

  return (
    <div className="space-y-2">
      {label ? (
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-full justify-between rounded-none border-input bg-background px-3 font-normal"
          >
            <span className={cn('truncate', !selectedYear && 'text-muted-foreground')}>
              {selectedYear ?? placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] rounded-none p-0"
        >
          <Command className="rounded-none">
            <CommandList className="max-h-72">
              {decades.map((decade) => {
                const isExpanded = expandedDecade === decade.key;
                return (
                  <div key={decade.key} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-base font-medium hover:bg-accent"
                      onClick={() => setExpandedDecade(isExpanded ? null : decade.key)}
                      aria-expanded={isExpanded}
                    >
                      <span>{decade.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded ? (
                      <div className="grid grid-cols-5 gap-1 px-2 pb-2">
                        {decade.years.map((year) => {
                          const isSelected = selectedYear === year;
                          return (
                            <CommandItem
                              key={year}
                              value={String(year)}
                              onSelect={() => {
                                onChange(year);
                                setOpen(false);
                              }}
                              className="justify-between rounded-none px-2 py-1 text-base"
                            >
                              <span>{year}</span>
                              {isSelected ? <Check className="h-3.5 w-3.5 text-brand-navy" /> : null}
                            </CommandItem>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
