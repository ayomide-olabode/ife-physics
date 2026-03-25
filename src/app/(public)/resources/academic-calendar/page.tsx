import Link from 'next/link';
import { PageHero } from '@/components/public/PageHero';

const CALENDAR_EMBED_URL =
  'https://calendar.google.com/calendar/embed?src=5c32db4079956df5a027d216b2cec4448a6c6faea709125b02c07532f8f6bf53%40group.calendar.google.com&ctz=Africa%2FLagos';

export default function AcademicCalendarPage() {
  return (
    <>
      <PageHero breadcrumbLabel="Resources" title="Academic Calendar" />

      <section className="py-14 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="mb-8 max-w-3xl text-base text-gray-700 sm:text-lg">
            Stay up to date with semester timelines, examination periods, breaks, and key
            department activities for the current academic session.
          </p>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <iframe
              src={CALENDAR_EMBED_URL}
              title="Department Academic Calendar"
              className="h-[620px] w-full sm:h-[680px] lg:h-[760px]"
              style={{ border: 0 }}
              frameBorder="0"
              scrolling="no"
            />
          </div>

          <p className="mt-5 text-sm text-gray-600">
            Having trouble viewing the embed?{' '}
            <Link
              href={CALENDAR_EMBED_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-navy underline underline-offset-4 hover:text-brand-navy/80"
            >
              Open the calendar in a new tab
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
