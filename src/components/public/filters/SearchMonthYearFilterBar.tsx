'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MonthYearGroupedSelect } from '@/components/forms/MonthYearGroupedSelect';
import type { MonthYearGroup } from '@/lib/monthYearFilter';

type SearchMonthYearFilterBarProps = {
  initialQuery?: string;
  initialMonth?: string;
  monthGroups: MonthYearGroup[];
  searchPlaceholder: string;
};

function buildHref(pathname: string, q: string, month: string) {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (month.trim()) params.set('month', month.trim());

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function SearchMonthYearFilterBar({
  initialQuery = '',
  initialMonth = '',
  monthGroups,
  searchPlaceholder,
}: SearchMonthYearFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [monthInput, setMonthInput] = useState(initialMonth);

  useEffect(() => {
    setQueryInput(initialQuery);
    setMonthInput(initialMonth);
  }, [initialMonth, initialQuery]);

  const applyFilterValue = (nextMonth: string) => {
    setMonthInput(nextMonth);
    router.push(buildHref(pathname, queryInput, nextMonth));
  };

  const runSearch = () => {
    router.push(buildHref(pathname, queryInput, monthInput));
  };

  return (
    <div className="mb-8 flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex w-full items-center gap-2 rounded-none border border-input px-3 md:w-auto md:min-w-[240px]">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <MonthYearGroupedSelect
            value={monthInput}
            onChange={applyFilterValue}
            groups={monthGroups}
            allLabel="All Months"
            placeholder="All Months"
            className="min-w-0"
          />
        </div>

        <div className="flex w-full flex-1 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch();
              }}
              placeholder={searchPlaceholder}
              className="pl-9 rounded-none"
            />
          </div>

          <Button type="button" className="w-fit shrink-0 rounded-none" onClick={runSearch}>
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
