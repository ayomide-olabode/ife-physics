import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/guards';
import { getAccessibleProgrammesForLevel } from '@/lib/rbac';

export default async function PostgraduatePage() {
  const session = await requireAuth();
  const allowedProgrammes = await getAccessibleProgrammesForLevel(session, 'POSTGRADUATE');
  const firstAllowed = allowedProgrammes[0];

  if (!firstAllowed) {
    notFound();
  }

  redirect(`/dashboard/postgraduate/${firstAllowed.toLowerCase()}/overview`);
}
