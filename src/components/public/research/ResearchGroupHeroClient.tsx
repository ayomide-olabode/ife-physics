'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Prose } from '@/components/public/Prose';

interface ResearchGroupHeroClientProps {
  title: string;
  overview: string | null;
}

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ResearchGroupHeroClient({ title, overview }: ResearchGroupHeroClientProps) {
  const [open, setOpen] = useState(false);
  const [showDiscoverMore, setShowDiscoverMore] = useState(false);
  const overviewRef = useRef<HTMLParagraphElement | null>(null);

  const overviewText = useMemo(() => stripHtml(overview || ''), [overview]);
  const hasOverview = overviewText.length > 0;

  useEffect(() => {
    const el = overviewRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setShowDiscoverMore(el.scrollHeight > el.clientHeight + 1);
    };

    const resizeObserver = new ResizeObserver(() => checkOverflow());
    resizeObserver.observe(el);
    const rafId = window.requestAnimationFrame(checkOverflow);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [overviewText]);

  if (!hasOverview) {
    return null;
  }

  return (
    <>
      <p
        ref={overviewRef}
        className="mt-4 text-base md:text-lg text-slate-200 leading-relaxed line-clamp-3 max-w-3xl"
      >
        {overviewText}
      </p>

      {showDiscoverMore ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-base md:text-base tracking-wide font-bold uppercase text-brand-yellow hover:underline"
        >
          Discover More →
        </button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-brand-navy">{title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto border border-black/10 bg-white p-5">
            <Prose html={overview || ''} className="text-gray-700" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
