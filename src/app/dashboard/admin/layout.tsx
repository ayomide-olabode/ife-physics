import { requireAuth, requireSuperAdmin } from '@/lib/guards';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  return (
    <>
      <ModuleTabs
        tabs={[
          { label: 'Users', href: '/dashboard/admin/users' },
          { label: 'Staff', href: '/dashboard/admin/staff' },
          { label: 'Secondary Affiliations', href: '/dashboard/admin/secondary-affiliations' },
          { label: 'Leadership', href: '/dashboard/admin/leadership' },
          { label: 'Audit Logs', href: '/dashboard/admin/audit-logs' },
        ]}
      />
      {children}
    </>
  );
}
