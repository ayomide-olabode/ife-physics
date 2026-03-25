import { notFound } from 'next/navigation';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { SecondaryAffiliationFormClient } from '@/components/admin/SecondaryAffiliationFormClient';
import { SecondaryAffiliationStaffList } from '@/components/admin/SecondaryAffiliationStaffList';
import { getSecondaryAffiliationById } from '@/server/queries/adminSecondaryAffiliations';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';

export default async function SecondaryAffiliationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  const { id } = await params;
  const affiliation = await getSecondaryAffiliationById(id);

  if (!affiliation) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/admin/secondary-affiliations" label="Back to affiliations" />
      <PageHeader
        title={affiliation.name}
        description="Update this secondary affiliation."
      />

      <SecondaryAffiliationFormClient
        mode="edit"
        affiliationId={affiliation.id}
        initialValues={{
          name: affiliation.name,
          acronym: affiliation.acronym,
          description: affiliation.description,
        }}
      />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Staff in this affiliation</h2>
        <SecondaryAffiliationStaffList staff={affiliation.staff} />
      </section>
    </div>
  );
}
