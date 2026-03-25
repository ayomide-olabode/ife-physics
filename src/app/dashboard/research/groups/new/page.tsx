import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';
import { ResearchGroupFormClient } from '@/components/research/ResearchGroupFormClient';

export default async function NewResearchGroupPage() {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/research/groups" label="Back to Research Groups" />

      <PageHeader
        title="New Research Group"
        description="Create a research group."
      />

      <ResearchGroupFormClient />
    </div>
  );
}
