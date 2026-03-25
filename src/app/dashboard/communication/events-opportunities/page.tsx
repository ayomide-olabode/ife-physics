import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { listEventsOpportunities } from '@/server/queries/eventsOpportunities';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { EventOpportunityListClient } from '@/components/communication/EventOpportunityListClient';

const BASE_PATH = '/dashboard/communication/events-opportunities';

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const { items, total, totalPages } = await listEventsOpportunities({
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events & Opportunities"
        description="Manage events and opportunities."
        actions={<AddNewButton href={`${BASE_PATH}/new`} label="New Item" />}
      />
      <EventOpportunityListClient
        items={items}
        pagination={{ page, totalPages, total }}
        basePath={BASE_PATH}
      />
    </div>
  );
}
