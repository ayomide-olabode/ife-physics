import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { listPublicationsForGroup } from '@/server/queries/publications';
import { PublicationsListClient } from '@/components/research/PublicationsListClient';

interface PageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function PublicationsIndexPage({ params, searchParams }: PageProps) {
  const { groupId } = await params;
  const resolvedSearch = await searchParams;

  const page = parseInt(resolvedSearch.page || '1', 10);
  const q = resolvedSearch.q;
  const year = resolvedSearch.year;

  const { data, total, pageSize } = await listPublicationsForGroup({
    groupId,
    q,
    year,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <BackToParent href={`/dashboard/research/groups/${groupId}`} label="Back to Group" />

      <PageHeader
        title="Research Outputs"
        description="Manage this group's research outputs."
        actions={
          <AddNewButton
            href={`/dashboard/research/groups/${groupId}/publications/new`}
            label="Add Research Output"
          />
        }
      />

      <PublicationsListClient
        groupId={groupId}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        searchQuery={q}
        yearQuery={year}
      />
    </div>
  );
}
