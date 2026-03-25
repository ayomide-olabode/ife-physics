import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { SecondaryAffiliationFormClient } from '@/components/admin/SecondaryAffiliationFormClient';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';

export default async function NewSecondaryAffiliationPage() {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/admin/secondary-affiliations" label="Back to affiliations" />
      <PageHeader
        title="New Secondary Affiliation"
        description="Create a secondary affiliation."
      />

      <SecondaryAffiliationFormClient mode="create" />
    </div>
  );
}
