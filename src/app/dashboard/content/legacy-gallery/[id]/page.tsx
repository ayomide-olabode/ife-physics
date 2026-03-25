import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getLegacyGalleryById } from '@/server/queries/legacyGallery';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LegacyGalleryFormClient } from '@/components/content/LegacyGalleryFormClient';
import { LegacyGalleryStatusActions } from '@/components/content/LegacyGalleryStatusActions';
import { ScopedRole } from '@prisma/client';
import { notFound } from 'next/navigation';
import { BackToParent } from '@/components/dashboard/BackToParent';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const data = await getLegacyGalleryById(id);

  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <BackToParent href="/dashboard/content/legacy-gallery" label="Legacy Gallery" />
        </div>

        <div className="flex items-center justify-between">
          <PageHeader title="Edit Legacy Item" description="Update this legacy item." />
          <LegacyGalleryStatusActions itemId={data.id} currentStatus={data.status} />
        </div>
      </div>

      <LegacyGalleryFormClient
        initialData={{
          ...data,
        }}
      />
    </div>
  );
}
