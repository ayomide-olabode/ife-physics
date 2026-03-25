import { EventOpportunityCard, type EventOpportunityItem } from './EventOpportunityCard';

export function EventOpportunityGrid({ items }: { items: EventOpportunityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-gray-500 text-center py-10">
        No events or opportunities right now. Check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item) => (
        <EventOpportunityCard key={item.id} item={item} />
      ))}
    </div>
  );
}
