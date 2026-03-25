import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { ModuleTabs, type TabItem } from '@/components/dashboard/ModuleTabs';
import { hasFullProfileTabAccessByStaffType } from '@/lib/rbac';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const staffId = session.user?.staffId;
  const isSuperAdmin = session.user?.isSuperAdmin === true;
  const canAccessFullProfileTabs = hasFullProfileTabAccessByStaffType(session.user?.staffType);

  if (!staffId) {
    return <>{children}</>;
  }

  const activeHodTerm = await prisma.leadershipTerm.findFirst({
    where: {
      role: 'HOD',
      endDate: null,
    },
    select: { staffId: true },
  });

  const isSessionHod = activeHodTerm?.staffId === staffId;

  const tabs: TabItem[] = [{ label: 'Overview', href: '/dashboard/profile/overview' }];

  if (canAccessFullProfileTabs) {
    tabs.push(
      { label: 'Research Outputs', href: '/dashboard/profile/research-outputs' },
      { label: 'Projects', href: '/dashboard/profile/projects' },
      { label: 'Teaching', href: '/dashboard/profile/teaching' },
      { label: 'Thesis Supervision', href: '/dashboard/profile/thesis-supervision' },
    );
  }

  if (canAccessFullProfileTabs && (isSuperAdmin || isSessionHod)) {
    tabs.push({ label: 'HOD Address', href: '/dashboard/profile/hod-address' });
  }

  return (
    <>
      <ModuleTabs tabs={tabs} />
      {children}
    </>
  );
}
