import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LegacyGalleryFormClient } from '@/components/content/LegacyGalleryFormClient';
import { ScopedRole } from '@prisma/client';
import { BackToParent } from '@/components/dashboard/BackToParent';

export default async function Page() {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href="/dashboard/content/legacy-gallery" label="Legacy Gallery" />
        <PageHeader
          title="New Legacy Item"
          description="Create a legacy gallery item."
        />
      </div>

      <LegacyGalleryFormClient />
    </div>
  );
}
