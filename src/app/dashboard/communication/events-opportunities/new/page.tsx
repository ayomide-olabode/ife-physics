import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EventOpportunityFormClient } from '@/components/communication/EventOpportunityFormClient';

export default async function Page() {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  return (
    <div className="space-y-6">
      <BackToParent
        href="/dashboard/communication/events-opportunities"
        label="Back to Events & Opportunities"
      />
      <PageHeader
        title="New Event / Opportunity"
        description="Create an event or opportunity."
      />
      <div className="rounded-lg border bg-card p-6">
        <EventOpportunityFormClient />
      </div>
    </div>
  );
}
