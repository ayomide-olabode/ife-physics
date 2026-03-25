import Image from 'next/image';
import { ResearchGroupHeroClient } from './ResearchGroupHeroClient';

interface ResearchGroupHeroProps {
  title: string;
  abbreviation: string;
  overview: string | null;
  heroImageUrl: string | null;
}

export function ResearchGroupHero({
  title,
  abbreviation,
  overview,
  heroImageUrl,
}: ResearchGroupHeroProps) {
  return (
    <section className="relative isolate w-full min-h-[420px] md:min-h-[460px] overflow-hidden">
      {heroImageUrl ? (
        <Image
          src={heroImageUrl}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy/90 to-brand-navy/70" />
      )}
      {heroImageUrl ? <div className="absolute inset-0 bg-black/45" aria-hidden="true" /> : null}

      <div className="relative z-10 h-full">
        <div className="absolute right-4 top-4 flex h-24 w-24 items-center justify-center border border-black/10 bg-brand-yellow md:hidden">
          <span className="text-2xl font-black uppercase tracking-wide text-brand-navy">
            {abbreviation}
          </span>
        </div>

        <div className="mx-auto flex min-h-[420px] w-full max-w-[1440px] items-end px-4 pb-10 pt-16 sm:px-6 md:min-h-[460px] lg:px-8">
          <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_160px] gap-5 md:gap-8 items-end">
            <div className="p-0 md:pr-6">
              <p className="text-base sm:text-base font-medium mb-2">
                <span className="text-brand-yellow">Research</span>
                <span className="text-white"> / </span>
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
                {title}
              </h1>
              <ResearchGroupHeroClient title={title} overview={overview} />
            </div>

            <div className="hidden h-[160px] w-[160px] items-center justify-center border border-black/10 bg-brand-yellow md:flex md:h-[180px] md:w-[180px] md:place-self-end">
              <span className="text-brand-navy text-4xl md:text-5xl font-black tracking-wide uppercase">
                {abbreviation}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
