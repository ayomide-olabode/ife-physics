import { requireAuth } from '@/lib/guards';
import { hasGlobalRole, isCurrentHod, isSuperAdmin } from '@/lib/rbac';
import { notFound } from 'next/navigation';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const canAccess =
    isSuperAdmin(session) ||
    (await hasGlobalRole(session, 'EDITOR')) ||
    (await isCurrentHod(session));
  if (!canAccess) {
    notFound();
  }

  return (
    <>
      <ModuleTabs
        tabs={[
          { label: 'History', href: '/dashboard/content/history' },
          { label: 'Roll of Honour', href: '/dashboard/content/roll-of-honour' },
          { label: 'Tributes', href: '/dashboard/content/tributes' },
          { label: 'Legacy Gallery', href: '/dashboard/content/legacy-gallery' },
          { label: 'Resources', href: '/dashboard/content/resources' },
        ]}
      />
      {children}
    </>
  );
}
