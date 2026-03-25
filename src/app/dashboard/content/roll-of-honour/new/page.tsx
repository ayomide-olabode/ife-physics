import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { RollOfHonourFormClient } from '@/components/content/RollOfHonourFormClient';
import { ScopedRole } from '@prisma/client';

export default async function Page() {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/content/roll-of-honour" label="Back to Roll of Honour" />
      <PageHeader title="New Roll of Honour Entry" description="Create a roll of honour entry." />

      <RollOfHonourFormClient />
    </div>
  );
}
