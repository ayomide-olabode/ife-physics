import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ResearchOutputEntryForm } from '@/components/profile/ResearchOutputEntryForm';

export default async function NewResearchOutputPage() {
  const session = await requireAuth();
  await requireFullProfileTabAccess(session);
  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <div className="p-8 text-center text-muted-foreground">No underlying staff record found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href="/dashboard/profile/research-outputs" label="Back to Research Outputs" />
        <PageHeader
          title="New Research Output"
          description="Add a research output."
        />
      </div>

      <ResearchOutputEntryForm />
    </div>
  );
}
