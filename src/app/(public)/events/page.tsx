import { SearchMonthYearFilterBar } from '@/components/public/filters/SearchMonthYearFilterBar';
import {
  listPublicEventOpportunityMonthGroups,
  listPublicEventsOpportunities,
} from '@/server/public/queries/eventsPublic';
import { EventOpportunityGrid } from '@/components/public/events/EventOpportunityGrid';

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function EventsPage(props: {
  searchParams: Promise<{ q?: string | string[]; month?: string | string[] }>;
}) {
  const searchParams = await props.searchParams;
  const q = (readParam(searchParams.q) || '').trim();
  const month = (readParam(searchParams.month) || '').trim();

  const [items, monthGroups] = await Promise.all([
    listPublicEventsOpportunities({
      limit: 60,
      q,
      month,
    }),
    listPublicEventOpportunityMonthGroups(),
  ]);

  return (
    <div className="py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-4xl font-serif font-bold text-brand-navy mb-3">
          Events &amp; Opportunities
        </h1>
        <p className="text-gray-600 mb-10 max-w-2xl">
          Upcoming events, seminars, workshops, funding opportunities, fellowships, and more from
          the Department of Physics and Engineering Physics.
        </p>

        <SearchMonthYearFilterBar
          initialQuery={q}
          initialMonth={month}
          monthGroups={monthGroups}
          searchPlaceholder="Search events or opportunities..."
        />

        <EventOpportunityGrid items={items} />
      </div>
    </div>
  );
}
