'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResearchOutputCard } from './ResearchOutputCard';
import type { RecentResearchOutputItem } from '@/server/public/queries/recentResearchOutputs';

function getScrollStep(track: HTMLDivElement): number {
  const firstCard = track.firstElementChild as HTMLDivElement | null;
  if (!firstCard) return track.clientWidth;

  const computed = window.getComputedStyle(track);
  const gap = parseFloat(computed.columnGap || computed.gap || '0');
  return firstCard.offsetWidth + gap;
}

export function ResearchOutputsCarousel({ items }: { items: RecentResearchOutputItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(items.length > 1);

  const syncControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft < maxScrollLeft - 4);
  }, []);

  const scrollByStep = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const step = getScrollStep(track);
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    syncControls();
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => syncControls();
    const onResize = () => syncControls();

    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [syncControls]);

  return (
    <>
      <div className="mb-10 flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-brand-navy">Research Outputs</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            disabled={!canPrev}
            aria-label="Previous research outputs"
            className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-gray-300 text-gray-500 transition-colors duration-300 hover:border-brand-navy/40 hover:bg-brand-navy/5 hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            disabled={!canNext}
            aria-label="Next research outputs"
            className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-gray-300 text-gray-500 transition-colors duration-300 hover:border-brand-navy/40 hover:bg-brand-navy/5 hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div
            key={`${item.groupSlug}-${item.id}`}
            className="min-w-0 shrink-0 snap-start basis-full md:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]"
          >
            <ResearchOutputCard {...item} />
          </div>
        ))}
      </div>
    </>
  );
}
