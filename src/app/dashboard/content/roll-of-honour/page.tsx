import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { listRollOfHonour } from '@/server/queries/rollOfHonour';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { RollOfHonourListClient } from '@/components/content/RollOfHonourListClient';
import { ScopedRole } from '@prisma/client';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; graduatingYear?: string; programme?: string }>;
}) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const q = params.q;
  const graduatingYear = params.graduatingYear ? parseInt(params.graduatingYear, 10) : undefined;
  const programme = params.programme;

  const { data, meta } = await listRollOfHonour({
    page,
    pageSize: 20,
    q,
    graduatingYear,
    programme,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roll of Honour"
        description="Manage roll of honour entries."
        actions={<AddNewButton href="/dashboard/content/roll-of-honour/new" label="New Entry" />}
      />
      <RollOfHonourListClient
        items={data}
        pagination={meta}
        searchQ={q}
        searchYear={graduatingYear}
        searchProg={programme}
      />
    </div>
  );
}
