import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { listSpotlight } from '@/server/queries/spotlight';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { SpotlightListClient } from '@/components/communication/SpotlightListClient';

const BASE_PATH = '/dashboard/communication/spotlight';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const q = params.q || '';

  const { items, total, totalPages } = await listSpotlight({
    page,
    pageSize: 20,
    q,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spotlight"
        description="Manage spotlight items."
        actions={<AddNewButton href={`${BASE_PATH}/new`} label="New Spotlight" />}
      />
      <SpotlightListClient
        items={items}
        pagination={{ page, totalPages, total }}
        basePath={BASE_PATH}
      />
    </div>
  );
}
