'use client';

import { useCallback, useEffect, useMemo, useState, type FocusEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface FeaturedNewsItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  body: string;
  date: Date;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonLink: string | null;
}

interface HeroSlide {
  key: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  href: string;
  imageSrc: string | null;
  tabLabel: string;
}

const AUTO_ADVANCE_MS = 5000;

function toPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function toExcerpt(value: string, maxLength = 140): string {
  const text = toPlainText(value);
  if (!text) return 'Discover updates from the Department of Physics and Engineering Physics.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function HeroCarousel({ items }: { items: FeaturedNewsItem[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const sessionStartYear = month >= 9 ? year : year - 1;
  const classYear = sessionStartYear + 4;

  const slides = useMemo<HeroSlide[]>(() => {
    const welcomeSlide: HeroSlide = {
      key: 'welcome',
      title: `Welcome, class of ${classYear}!`,
      subtitle:
        'Welcome to the Great If\u1EB9\u0300 legacy. You have now joined a long and proud legacy of excellence, character and distinction. Are you ready for the future?',
      buttonLabel: 'Get started here',
      href: 'https://eportal.oauife.edu.ng',
      imageSrc: '/assets/hero.png',
      tabLabel: `Welcome to the Great If\u1EB9\u0300 legacy, class of ${classYear}!`,
    };

    const newsSlides = items.slice(0, 3).map((item) => ({
      key: item.slug || item.id,
      title: item.title,
      subtitle: item.subtitle?.trim() || toExcerpt(item.body),
      buttonLabel: item.buttonLabel ?? 'Learn more',
      href: item.buttonLink || `/news/${item.slug}`,
      imageSrc: item.imageUrl,
      tabLabel: item.title,
    }));

    return [welcomeSlide, ...newsSlides].slice(0, 4);
  }, [classYear, items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setIsReducedMotion(mediaQuery.matches);
    update();

    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isReducedMotion || isHovering || isFocusWithin) return;
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, isFocusWithin, isHovering, isReducedMotion, slides.length]);

  const handleBlurCapture = useCallback((event: FocusEvent<HTMLElement>) => {
    const nextFocused = event.relatedTarget;
    if (!(nextFocused instanceof Node) || !event.currentTarget.contains(nextFocused)) {
      setIsFocusWithin(false);
    }
  }, []);

  const onSelectSlide = useCallback((index: number) => setActiveIndex(index), []);
  const onPrevSlide = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  }, [slides.length]);
  const onNextSlide = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const resolvedActiveIndex = activeIndex >= slides.length ? 0 : activeIndex;
  const activeSlide = slides[resolvedActiveIndex];
  const tabRackWidthPercent = Math.min(Math.max(slides.length, 1), 4) * 25;
  const cardClassName = 'bg-white shadow-lg border border-black/10 p-6 md:p-8';

  const renderSlideImage = () => {
    if (activeSlide.imageSrc) {
      return (
        <Image
          src={activeSlide.imageSrc}
          alt={activeSlide.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority={resolvedActiveIndex === 0}
        />
      );
    }

    return <div className="absolute inset-0 bg-brand-navy/80" aria-hidden="true" />;
  };

  const renderSlideCardContent = (slide: HeroSlide) => (
    <>
      <h1 className="text-2xl md:text-4xl font-serif font-bold text-brand-navy leading-tight mb-4">
        {slide.title}
      </h1>
      <p className="text-base md:text-base text-slate-700 mb-6 line-clamp-4">{slide.subtitle}</p>
      <div className="grow h-auto" />
      <Link
        href={slide.href}
        className="inline-flex items-center justify-center bg-brand-yellow text-brand-ink font-semibold px-6 py-3 text-base transition-colors hover:bg-yellow-500"
      >
        {slide.buttonLabel}
      </Link>
    </>
  );

  return (
    <section
      className="relative lg:h-[700px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={handleBlurCapture}
      aria-label="Featured news carousel"
    >
      <div className="lg:hidden">
        <div className="relative w-full h-[300px] sm:h-[360px] md:h-[420px]">
          {renderSlideImage()}
        </div>

        <div className="px-4 sm:px-6 py-6 md:py-8">
          {slides.map((slide, index) => {
            const isActive = index === resolvedActiveIndex;
            return (
              <div
                key={slide.key}
                id={`hero-panel-mobile-${index}`}
                role="tabpanel"
                aria-hidden={!isActive}
                hidden={!isActive}
                aria-labelledby={`hero-tab-mobile-${index}`}
                className={cardClassName}
              >
                {renderSlideCardContent(slide)}
              </div>
            );
          })}
        </div>

        {slides.length > 1 && (
          <div className="px-4 sm:px-6 pb-6 md:pb-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrevSlide}
                aria-label="Previous slide"
                className="h-12 w-12 shrink-0  bg-white text-brand-navy flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div
                role="tablist"
                aria-label="Featured news slides"
                className="flex-1 grid gap-1 "
                style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }}
              >
                {slides.map((slide, index) => {
                  const isActive = index === resolvedActiveIndex;
                  return (
                    <button
                      key={slide.key}
                      id={`hero-tab-mobile-${index}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`hero-panel-mobile-${index}`}
                      onClick={() => onSelectSlide(index)}
                      className={`w-full h-1.5 min-w-0 border border-brand-yellow px-3 text-left transition-colors  relative ${
                        isActive
                          ? 'bg-brand-yellow text-brand-navy '
                          : 'bg-white text-slate-600 hover:bg-gray-50'
                      }`}
                    ></button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onNextSlide}
                aria-label="Next slide"
                className="h-12 w-12 shrink-0  bg-white text-brand-navy flex items-center justify-center"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:block relative h-full overflow-hidden">
        {renderSlideImage()}

        <div className="absolute inset-0 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pointer-events-none">
          {slides.map((slide, index) => {
            const isActive = index === resolvedActiveIndex;
            return (
              <div
                key={slide.key}
                id={`hero-panel-desktop-${index}`}
                role="tabpanel"
                aria-hidden={!isActive}
                hidden={!isActive}
                aria-labelledby={`hero-tab-desktop-${index}`}
                className={`pointer-events-auto absolute left-4 right-4 bottom-[96px] md:left-auto md:right-16 md:top-24 md:bottom-auto md:w-[420px] ${cardClassName}`}
              >
                {renderSlideCardContent(slide)}
              </div>
            );
          })}
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 z-20 w-full">
            <div
              role="tablist"
              aria-label="Featured news slides"
              className="mx-auto max-w-[1440px] px-16 w-full grid gap-0 relative "
              style={{
                width: `${tabRackWidthPercent}%`,
                gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))`,
              }}
            >
              {slides.map((slide, index) => {
                const isActive = index === resolvedActiveIndex;
                return (
                  <button
                    key={slide.key}
                    id={`hero-tab-desktop-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`hero-panel-desktop-${index}`}
                    onClick={() => onSelectSlide(index)}
                    className={`h-24 w-full min-w-0 border border-black/5 px-4 text-left transition-colors border-t-brand-yellow border-t-2 relative ${
                      isActive
                        ? 'bg-white text-brand-navy '
                        : 'bg-white text-slate-600 hover:bg-gray-50'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 left-0 h-1 w-full bg-brand-yellow" />
                    )}
                    <span className="block text-lg line-clamp-2">{slide.tabLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
