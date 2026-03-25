'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HistoryModalClient } from '@/components/public/history/HistoryModalClient';

export type HistoryEntryDTO = {
  id: string;
  year: number;
  decade: string;
  title: string;
  shortDescription: string;
};

export type DecadeGroup = {
  decadeLabel: string;
  decadeKey: string;
  entriesFlat: HistoryEntryDTO[];
};

export function HistoryTimeline({
  decades,
  allEntries,
}: {
  decades: DecadeGroup[];
  allEntries: HistoryEntryDTO[];
}) {
  const [activeDecadeKey, setActiveDecadeKey] = useState('all');
  const [windowStart, setWindowStart] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(1);
  const [selectedItem, setSelectedItem] = useState<HistoryEntryDTO | null>(null);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth >= 1024) return setCardsPerView(3);
      if (window.innerWidth >= 768) return setCardsPerView(2);
      setCardsPerView(1);
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const selectedDecade = useMemo(
    () => decades.find((d) => d.decadeKey === activeDecadeKey) ?? null,
    [activeDecadeKey, decades],
  );

  const selectedEntries = selectedDecade?.entriesFlat ?? [];

  const selectedTitle = useMemo(() => {
    if (activeDecadeKey === 'all') return 'All Periods';
    return decades.find((d) => d.decadeKey === activeDecadeKey)?.decadeLabel ?? 'All Periods';
  }, [activeDecadeKey, decades]);

  const maxWindowStart = Math.max(0, selectedEntries.length - cardsPerView);
  const safeWindowStart = Math.min(windowStart, maxWindowStart);
  const canPrev = safeWindowStart > 0;
  const canNext = safeWindowStart + cardsPerView < selectedEntries.length;
  const visibleEntries = selectedEntries.slice(safeWindowStart, safeWindowStart + cardsPerView);

  const selectPeriod = (decadeKey: string) => {
    setActiveDecadeKey(decadeKey);
    setWindowStart(0);
  };

  const renderCard = (entry: HistoryEntryDTO) => (
    <button
      key={entry.id}
      type="button"
      onClick={() => setSelectedItem(entry)}
      className="w-full cursor-pointer text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 h-full"
      aria-label={`View full history entry: ${entry.title}`}
    >
      <article className="bg-white border border-black/10 shadow-sm p-6 h-full">
        <span className="inline-block bg-brand-navy text-white text-sm font-semibold px-2 py-1 mb-3">
          {entry.year}
        </span>
        <h3 className="text-lg font-semibold text-brand-navy leading-snug">{entry.title}</h3>
        <p className="mt-2 text-base text-gray-600 leading-relaxed line-clamp-4">
          {entry.shortDescription}
        </p>
      </article>
    </button>
  );

  return (
    <div className="flex gap-12">
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <nav
          className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto border border-black/10 bg-white"
          aria-label="Decade navigation"
        >
          <div className="p-4 border-b border-black/10">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold">
              Decades
            </h3>
          </div>

          <ul className="p-2 space-y-1">
            <li>
              <button
                type="button"
                onClick={() => selectPeriod('all')}
                className={`w-full px-3 py-2 text-left text-base font-semibold transition-colors ${
                  activeDecadeKey === 'all'
                    ? 'bg-brand-navy text-white'
                    : 'text-gray-500 hover:text-brand-navy hover:bg-gray-50'
                }`}
              >
                All Periods
              </button>
            </li>
            {decades.map((decade) => {
              const isActive = activeDecadeKey === decade.decadeKey;
              return (
                <li key={decade.decadeKey}>
                  <button
                    type="button"
                    onClick={() => selectPeriod(decade.decadeKey)}
                    className={`w-full px-3 py-2 text-left text-base font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-navy text-white'
                        : 'text-gray-500 hover:text-brand-navy hover:bg-gray-50'
                    }`}
                  >
                    {decade.decadeLabel}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {activeDecadeKey === 'all' ? (
          <div className="space-y-10">
            <h2 className="text-2xl font-serif font-bold text-brand-navy border-b-2 border-brand-yellow pb-2 inline-block">
              All Periods
            </h2>
            {allEntries.length === 0 ? (
              <p className="text-base text-gray-500 border border-gray-200 bg-white p-6">
                No history entries available for this period.
              </p>
            ) : (
              <div className="space-y-12">
                {decades.map((decade) => (
                  <section key={decade.decadeKey} className="space-y-6">
                    <div className="flex items-end gap-4">
                      <h3 className="text-2xl font-serif font-semibold text-brand-navy py-4 border-b-2 border-brand-yellow">
                        {decade.decadeLabel}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {decade.entriesFlat.map(renderCard)}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-serif font-bold text-brand-navy border-b-2 border-brand-yellow pb-2 inline-block">
                {selectedTitle}
              </h2>

              {selectedEntries.length > cardsPerView && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWindowStart((current) => Math.max(0, current - 1))}
                    disabled={!canPrev}
                    aria-label="Previous history entries"
                    className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setWindowStart((current) => Math.min(maxWindowStart, current + 1))
                    }
                    disabled={!canNext}
                    aria-label="Next history entries"
                    className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {selectedEntries.length === 0 ? (
              <p className="text-base text-gray-500 border border-gray-200 bg-white p-6">
                No history entries available for this period.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleEntries.map(renderCard)}
              </div>
            )}
          </div>
        )}
      </div>

      <HistoryModalClient item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
