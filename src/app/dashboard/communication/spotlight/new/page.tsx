import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { SpotlightFormClient } from '@/components/communication/SpotlightFormClient';

const BASE_PATH = '/dashboard/communication/spotlight';

export default async function Page() {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  return (
    <div className="space-y-6">
      <BackToParent href={BASE_PATH} label="Back to Spotlight" />
      <PageHeader title="New Spotlight Item" description="Create a spotlight item." />
      <div className="rounded-lg border bg-card p-6">
        <SpotlightFormClient />
      </div>
    </div>
  );
}
