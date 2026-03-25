import { EventOpportunityCarousel } from '@/components/public/home/EventOpportunityCarousel';
import { listPublicEventOpportunities } from '@/server/public/queries/eventsPublic';

export async function UpcomingEventsSection() {
  const [allItems, eventItems, opportunityItems] = await Promise.all([
    listPublicEventOpportunities({ limit: 9 }),
    listPublicEventOpportunities({ limit: 9, type: 'EVENT' }),
    listPublicEventOpportunities({ limit: 9, type: 'OPPORTUNITY' }),
  ]);

  return (
    <EventOpportunityCarousel
      allItems={allItems}
      eventItems={eventItems}
      opportunityItems={opportunityItems}
    />
  );
}
