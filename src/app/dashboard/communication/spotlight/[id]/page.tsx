import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { notFound } from 'next/navigation';
import { getSpotlightById } from '@/server/queries/spotlight';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { SpotlightFormClient } from '@/components/communication/SpotlightFormClient';
import { SpotlightStatusActions } from '@/components/communication/SpotlightStatusActions';

const BASE_PATH = '/dashboard/communication/spotlight';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const item = await getSpotlightById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BackToParent href={BASE_PATH} label="Back to Spotlight" />
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader title="Edit Spotlight Item" description={`Update "${item.title}".`} />
        <SpotlightStatusActions id={item.id} status={item.status} />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <SpotlightFormClient
          initial={{
            id: item.id,
            title: item.title,
            date: item.date?.toISOString() ?? null,
            text: item.text,
            imageUrl: item.imageUrl,
          }}
        />
      </div>
    </div>
  );
}
