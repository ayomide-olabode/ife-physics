import Image from 'next/image';

interface PageHeroProps {
  breadcrumbLabel: string;
  title: string;
  backgroundImageSrc?: string;
  backgroundImageAlt?: string;
}

export function PageHero({
  breadcrumbLabel,
  title,
  backgroundImageSrc,
  backgroundImageAlt = '',
}: PageHeroProps) {
  return (
    <>
      <section className="relative h-[340px] sm:h-[380px] lg:h-[420px] overflow-hidden">
        {backgroundImageSrc ? (
          <Image
            src={backgroundImageSrc}
            alt={backgroundImageAlt}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy/90 to-brand-navy/70" />
        )}

        <div className="absolute inset-0 bg-brand-navy/70" />

        <div className="relative z-10 flex h-full items-end">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-20">
            <p className="text-base sm:text-base font-medium mb-2">
              <span className="text-brand-yellow">{breadcrumbLabel}</span>
              <span className="text-white"> / </span>
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
              {title}
            </h1>
          </div>
        </div>
      </section>
    </>
  );
}
