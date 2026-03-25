import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PublicationFormClient } from '@/components/research/PublicationFormClient';
import { getPublicationByIdForGroup } from '@/server/queries/publications';

interface PageProps {
  params: Promise<{ groupId: string; id: string }>;
}

export default async function EditPublicationPage({ params }: PageProps) {
  const { groupId, id } = await params;

  const publication = await getPublicationByIdForGroup({ groupId, id });

  if (!publication) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BackToParent
        href={`/dashboard/research/groups/${groupId}/publications`}
        label="Research Outputs"
      />

      <PageHeader title="Edit Research Output" description="Update this research output." />

      <PublicationFormClient
        groupId={groupId}
        initialData={{
          id: publication.id,
          title: publication.title,
          authors: publication.authors,
          year: publication.year,
          venue: publication.venue,
          doi: publication.doi,
          url: publication.url,
          abstract: publication.abstract,
        }}
      />
    </div>
  );
}
