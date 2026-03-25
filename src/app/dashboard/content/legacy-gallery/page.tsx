import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { ScopedRole } from '@prisma/client';
import { listLegacyGallery } from '@/server/queries/legacyGallery';
import { LegacyGalleryListClient } from '@/components/content/LegacyGalleryListClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  // Await the search parameters
  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || '1', 10);
  const q = resolvedParams.q;
  const year = resolvedParams.year;
  const status = resolvedParams.status;

  const { data, total, pageSize } = await listLegacyGallery({
    q,
    year,
    status,
    page,
    pageSize: 15,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legacy Gallery"
        description="Manage legacy gallery entries."
        actions={<AddNewButton href="/dashboard/content/legacy-gallery/new" label="Add New Item" />}
      />

      <LegacyGalleryListClient
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        searchQuery={q}
        yearQuery={year}
        statusQuery={status}
      />
    </div>
  );
}
