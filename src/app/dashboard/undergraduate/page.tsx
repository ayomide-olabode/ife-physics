import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/guards';
import { getAccessibleProgrammesForLevel } from '@/lib/rbac';

export default async function UndergraduateIndexPage() {
  const session = await requireAuth();
  const allowedProgrammes = await getAccessibleProgrammesForLevel(session, 'UNDERGRADUATE');
  const firstAllowed = allowedProgrammes[0];

  if (!firstAllowed) {
    notFound();
  }

  redirect(`/dashboard/undergraduate/${firstAllowed.toLowerCase()}/overview`);
}
