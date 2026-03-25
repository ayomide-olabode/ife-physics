import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PublicationFormClient } from '@/components/research/PublicationFormClient';

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function NewPublicationPage({ params }: PageProps) {
  const { groupId } = await params;

  return (
    <div className="space-y-6">
      <BackToParent
        href={`/dashboard/research/groups/${groupId}/publications`}
        label="Research Outputs"
      />

      <PageHeader title="New Research Output" description="Add a research output." />

      <PublicationFormClient groupId={groupId} />
    </div>
  );
}
