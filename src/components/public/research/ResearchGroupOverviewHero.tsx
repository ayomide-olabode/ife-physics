'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Prose } from '@/components/public/Prose';

type ResearchGroupOverviewHeroProps = {
  title: string;
  abbreviation: string;
  overview: string | null;
};

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ResearchGroupOverviewHero({
  title,
  abbreviation,
  overview,
}: ResearchGroupOverviewHeroProps) {
  const [open, setOpen] = useState(false);

  const overviewText = useMemo(() => stripHtml(overview || ''), [overview]);
  const hasOverview = overviewText.length > 0;

  return (
    <>
      <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid gap-0 md:grid-cols-[1fr_120px] shadow-sm">
          <div className="bg-white border border-black/10 p-6 md:p-8 space-y-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-navy">{title}</h2>

            {hasOverview ? (
              <>
                <p className="text-base md:text-base leading-relaxed text-gray-700 line-clamp-4">
                  {overviewText}
                </p>
                {hasOverview ? (
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="text-brand-navy text-base font-semibold hover:underline"
                  >
                    Discover More →
                  </button>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="bg-brand-yellow border border-black/10 border-t-0 md:border-t md:border-l-0 flex items-center justify-center p-4">
            <span className="text-brand-navy text-3xl md:text-4xl font-black tracking-wide uppercase">
              {abbreviation}
            </span>
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-brand-navy">{title}</DialogTitle>
          </DialogHeader>
          {overview ? (
            <div className="max-h-[70vh] overflow-y-auto border border-black/10 bg-white p-5">
              <Prose html={overview} className="text-gray-700" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
