import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/guards';
import { hasGlobalRole, isCurrentHod, isSuperAdmin } from '@/lib/rbac';

export default async function ContentTributesLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  if (isSuperAdmin(session)) {
    return children;
  }

  if (await hasGlobalRole(session, 'EDITOR')) {
    return children;
  }

  if (await isCurrentHod(session)) {
    return children;
  }

  notFound();
}
