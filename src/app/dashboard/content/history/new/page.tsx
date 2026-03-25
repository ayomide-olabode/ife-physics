import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { HistoryFormClient } from '@/components/content/HistoryFormClient';
import { ScopedRole } from '@prisma/client';

export default async function Page() {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/content/history" label="Back to History" />
      <PageHeader title="New History Entry" description="Create a history entry." />

      <HistoryFormClient />
    </div>
  );
}
