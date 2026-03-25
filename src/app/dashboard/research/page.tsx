import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/guards';
import { isSuperAdmin } from '@/lib/rbac';
import { listResearchGroupsForUser } from '@/server/queries/researchGroups';

export default async function Page() {
  const session = await requireAuth();

  if (isSuperAdmin(session)) {
    redirect('/dashboard/research/groups');
  }

  const { items } = await listResearchGroupsForUser({
    session,
    page: 1,
    pageSize: 1,
  });
  if (items.length > 0) {
    redirect(`/dashboard/research/groups/${items[0].id}`);
  }

  redirect('/dashboard/research/groups');
}
