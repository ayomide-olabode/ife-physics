import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { listHistory } from '@/server/queries/history';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { HistoryListClient } from '@/components/content/HistoryListClient';
import { PublishStatus, ScopedRole } from '@prisma/client';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const q = params.q;
  const status = (params.status || undefined) as PublishStatus | undefined;

  const { data, meta } = await listHistory({ page, pageSize: 20, q, status });

  // Map the stripped down query result to the format expected by HistoryListClient
  const mappedData = data.map((d) => ({
    id: d.id,
    title: d.title,
    year: d.year,
    status: d.status,
    createdAt: d.createdAt,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="Manage history entries."
        actions={<AddNewButton href="/dashboard/content/history/new" label="New Entry" />}
      />
      <HistoryListClient items={mappedData} pagination={meta} searchQ={q} searchStatus={status} />
    </div>
  );
}
