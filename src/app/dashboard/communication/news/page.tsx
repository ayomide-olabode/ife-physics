import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { listNews } from '@/server/queries/news';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { NewsListClient } from '@/components/communication/NewsListClient';

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const { items, total, totalPages } = await listNews({ page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="News"
        description="Manage news articles."
        actions={<AddNewButton href="/dashboard/communication/news/new" label="New Article" />}
      />
      <NewsListClient items={items} pagination={{ page, totalPages, total }} />
    </div>
  );
}
