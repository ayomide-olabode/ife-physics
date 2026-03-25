import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { NewsFormClient } from '@/components/communication/NewsFormClient';

export default async function Page() {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/communication/news" label="Back to News" />
      <PageHeader title="New Article" description="Create a news article." />
      <div className="rounded-lg border bg-card p-6">
        <NewsFormClient />
      </div>
    </div>
  );
}
