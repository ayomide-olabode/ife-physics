'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { PublicRohEntry } from '@/server/public/queries/rollOfHonourPublic';
import { RollOfHonourCard } from './RollOfHonourCard';

type YearLoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  entries: PublicRohEntry[];
};

export function RollOfHonourYears({
  initialYears,
  remainingYears,
}: {
  initialYears: number[];
  remainingYears: number[];
}) {
  const allYears = useMemo(() => [...initialYears, ...remainingYears], [initialYears, remainingYears]);
  const [visibleCount, setVisibleCount] = useState(initialYears.length);
  const [openYear, setOpenYear] = useState<number | null>(initialYears[0] ?? null);
  const [yearData, setYearData] = useState<Record<number, YearLoadState>>({});

  const visibleYears = allYears.slice(0, visibleCount);

  async function loadYear(year: number) {
    setYearData((prev) => ({
      ...prev,
      [year]: { status: 'loading', entries: prev[year]?.entries ?? [] },
    }));

    try {
      const res = await fetch(`/api/public/roll-of-honour?year=${year}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load year');

      const data = (await res.json()) as { entries: PublicRohEntry[] };
      setYearData((prev) => ({
        ...prev,
        [year]: { status: 'ready', entries: data.entries || [] },
      }));
    } catch {
      setYearData((prev) => ({
        ...prev,
        [year]: { status: 'error', entries: [] },
      }));
    }
  }

  async function handleToggleYear(year: number) {
    if (openYear === year) {
      setOpenYear(null);
      return;
    }

    setOpenYear(year);
    const state = yearData[year];
    if (!state || state.status === 'idle' || state.status === 'error') {
      await loadYear(year);
    }
  }

  useEffect(() => {
    if (!openYear) return;
    const state = yearData[openYear];
    if (!state || state.status === 'idle' || state.status === 'error') {
      void loadYear(openYear);
    }
  }, [openYear, yearData]);

  if (allYears.length === 0) {
    return (
      <div className="border border-gray-200 bg-white p-10 text-center">
        <p className="text-gray-500">No roll of honours entries available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleYears.map((year) => {
        const isOpen = openYear === year;
        const state = yearData[year];

        return (
          <div key={year} className="border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => handleToggleYear(year)}
              className="flex w-full items-center justify-between bg-brand-navy px-6 py-4 text-left text-white"
            >
              <span className="text-lg font-semibold">Class of {year}</span>
              {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>

            {isOpen ? (
              <div className="bg-white p-6">
                {state?.status === 'loading' ? (
                  <p className="text-base text-gray-500">Loading class entries...</p>
                ) : state?.status === 'error' ? (
                  <p className="text-base text-red-600">Unable to load this class year right now.</p>
                ) : (state?.entries?.length ?? 0) === 0 ? (
                  <p className="text-base text-gray-500">No honourees found for Class of {year}.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {state?.entries.map((entry) => (
                      <RollOfHonourCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      {visibleCount < allYears.length ? (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(allYears.length, count + 5))}
            className="border border-brand-navy px-6 py-2 text-base font-semibold text-brand-navy transition-colors hover:bg-brand-navy hover:text-white"
          >
            Load more years
          </button>
        </div>
      ) : null}
    </div>
  );
}
