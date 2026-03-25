'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  EventOpportunityCard,
  type EventOpportunityItem,
} from '@/components/public/events/EventOpportunityCard';

type FilterKey = 'ALL' | 'EVENTS' | 'OPPORTUNITIES';

export function EventOpportunityCarousel({
  allItems,
  eventItems,
  opportunityItems,
}: {
  allItems: EventOpportunityItem[];
  eventItems: EventOpportunityItem[];
  opportunityItems: EventOpportunityItem[];
}) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(1);

  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth >= 1024) {
        setPerPage(3);
        return;
      }
      if (window.innerWidth >= 768) {
        setPerPage(2);
        return;
      }
      setPerPage(1);
    };

    updatePerPage();
    window.addEventListener('resize', updatePerPage);
    return () => window.removeEventListener('resize', updatePerPage);
  }, []);

  const items = useMemo(() => {
    if (activeFilter === 'EVENTS') return eventItems;
    if (activeFilter === 'OPPORTUNITIES') return opportunityItems;
    return allItems;
  }, [activeFilter, allItems, eventItems, opportunityItems]);

  const selectFilter = (filter: FilterKey) => {
    setActiveFilter(filter);
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * perPage;
  const visibleItems = items.slice(start, start + perPage);
  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
            <h2 className="text-3xl font-serif font-bold text-brand-navy w-full">
              Upcoming Events
            </h2>

            <div className="w-full md:w-fit flex gap-4">
              <div className="inline-flex w-full border border-black/10 bg-white sm:w-auto">
                <button
                  type="button"
                  onClick={() => selectFilter('ALL')}
                  className={`flex-1 border-r border-black/10 px-3 py-2 text-sm font-semibold sm:flex-none sm:px-4 sm:text-base ${
                    activeFilter === 'ALL'
                      ? 'bg-brand-navy text-white'
                      : 'bg-white text-brand-navy hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('EVENTS')}
                  className={`flex-1 border-r border-black/10 px-3 py-2 text-sm font-semibold sm:flex-none sm:px-4 sm:text-base ${
                    activeFilter === 'EVENTS'
                      ? 'bg-brand-navy text-white'
                      : 'bg-white text-brand-navy hover:bg-slate-50'
                  }`}
                >
                  Events
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('OPPORTUNITIES')}
                  className={`flex-1 px-3 py-2 text-sm font-semibold sm:flex-none sm:px-4 sm:text-base ${
                    activeFilter === 'OPPORTUNITIES'
                      ? 'bg-brand-navy text-white'
                      : 'bg-white text-brand-navy hover:bg-slate-50'
                  }`}
                >
                  Opportunities
                </button>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={!canPrev}
                  aria-label="Previous events page"
                  className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={!canNext}
                  aria-label="Next events page"
                  className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <Link
                  href="/events"
                  className="text-base font-semibold text-brand-navy border border-brand-navy px-5 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors text-nowrap"
                >
                  View All
                </Link>
              </div>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No events or opportunities right now. Check back soon.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleItems.map((item) => (
                <EventOpportunityCard key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={!canPrev}
                aria-label="Previous events page"
                className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                disabled={!canNext}
                aria-label="Next events page"
                className="h-10 w-10 border border-black/10 text-brand-navy flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <Link
                href="/events"
                className="ml-auto inline-flex h-10 items-center border border-brand-navy px-5 text-base font-semibold text-brand-navy transition-colors hover:bg-brand-navy hover:text-brand-white"
              >
                View All
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
