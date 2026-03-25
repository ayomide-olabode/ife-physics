import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import { getMyResearchOutputById } from '@/server/queries/profileResearchOutputs';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ResearchOutputEntryForm } from '@/components/profile/ResearchOutputEntryForm';
import { notFound } from 'next/navigation';
import { mapLegacyToApa } from '@/lib/legacyResearchOutputCompat';

export default async function EditResearchOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  await requireFullProfileTabAccess(session);
  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <div className="p-8 text-center text-muted-foreground">No underlying staff record found.</div>
    );
  }

  const { id } = await params;
  const data = await getMyResearchOutputById({ staffId, id });

  if (!data) return notFound();

  // Map legacy fields → APA shape (safe — only fills in blanks)
  const compat = mapLegacyToApa({
    type: data.type,
    authors: data.authors,
    doi: data.doi,
    venue: data.venue,
    authorsJson: data.authorsJson,
    keywordsJson: data.keywordsJson,
    metaJson: data.metaJson,
    sourceTitle: data.sourceTitle,
    publisher: data.publisher,
    groupAuthor: data.groupAuthor,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href="/dashboard/profile/research-outputs" label="Back to Research Outputs" />
        <PageHeader
          title="Edit Research Output"
          description="Update this research output."
        />
      </div>

      <ResearchOutputEntryForm
        initialData={{
          id: data.id,
          type: data.type,
          title: data.title,
          authors: data.authors || '',
          groupAuthor: compat.groupAuthor,
          doi: compat.doi,
          year: data.year?.toString() || '',
          metaJson: compat.metaJson as Record<string, unknown>,
          authorsJson: compat.authorsJson,
        }}
      />
    </div>
  );
}
