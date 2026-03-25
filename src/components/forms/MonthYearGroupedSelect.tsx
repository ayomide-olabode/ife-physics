'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  formatMonthYearLabel,
  formatMonthYearValue,
  monthShortLabel,
  parseYearMonth,
  type MonthYearGroup,
} from '@/lib/monthYearFilter';

type MonthYearGroupedSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  groups: MonthYearGroup[];
  allLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function MonthYearGroupedSelect({
  value,
  onChange,
  groups,
  allLabel = 'All',
  placeholder = 'Month & Year',
  disabled = false,
  className,
}: MonthYearGroupedSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = parseYearMonth(value);
  const initialYear = selected?.year ?? groups[0]?.year ?? null;
  const [expandedYear, setExpandedYear] = useState<number | null>(initialYear);

  useEffect(() => {
    if (selected?.year) {
      setExpandedYear(selected.year);
      return;
    }
    if (!expandedYear && groups[0]?.year) {
      setExpandedYear(groups[0].year);
    }
  }, [expandedYear, groups, selected?.year]);

  const selectedLabel = useMemo(() => {
    if (!value) return allLabel;
    return formatMonthYearLabel(value);
  }, [allLabel, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between bg-transparent px-0 text-left text-base',
            className,
          )}
        >
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] rounded-none p-0">
        <Command className="rounded-none">
          <CommandList className="max-h-72">
            <div className="border-b border-border">
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="justify-between rounded-none px-3 py-2 text-base"
              >
                <span>{allLabel}</span>
                {!value ? <Check className="h-3.5 w-3.5 text-brand-navy" /> : null}
              </CommandItem>
            </div>
            {groups.map((group) => {
              const isExpanded = expandedYear === group.year;
              return (
                <div key={group.year} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-base font-medium hover:bg-accent"
                    onClick={() => setExpandedYear(isExpanded ? null : group.year)}
                    aria-expanded={isExpanded}
                  >
                    <span>{group.year}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded ? (
                    <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                      {group.months.map((month) => {
                        const optionValue = formatMonthYearValue(group.year, month);
                        const isSelected = value === optionValue;
                        return (
                          <CommandItem
                            key={optionValue}
                            value={optionValue}
                            onSelect={() => {
                              onChange(optionValue);
                              setOpen(false);
                            }}
                            className="justify-between rounded-none px-2 py-1 text-base"
                          >
                            <span>{monthShortLabel(month)}</span>
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
  );
}
