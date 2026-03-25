import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import {
  getAccessibleProgrammesForLevel,
  getScopedResearchGroupIds,
  hasGlobalRole,
  isSuperAdmin,
} from '@/lib/rbac';
import type { NavItem } from '@/components/dashboard/DashboardSidebar';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Build role-aware nav items server-side
  const navItems: NavItem[] = [
    { label: 'Profile', href: '/dashboard/profile/overview' },
  ];

  const isAdmin = isSuperAdmin(session);

  // Communication + Content: EDITOR or superadmin
  if (isAdmin || (await hasGlobalRole(session, 'EDITOR'))) {
    navItems.push({ label: 'Communication', href: '/dashboard/communication' });
    navItems.push({ label: 'Content', href: '/dashboard/content' });
  }

  const undergraduateProgrammes = await getAccessibleProgrammesForLevel(session, 'UNDERGRADUATE');
  const postgraduateProgrammes = await getAccessibleProgrammesForLevel(session, 'POSTGRADUATE');

  if (undergraduateProgrammes.length > 0) {
    navItems.push({
      label: 'Undergraduate',
      href: '/dashboard/undergraduate',
      children: undergraduateProgrammes.map((code) => ({
        label:
          code === 'PHY'
            ? 'Physics'
            : code === 'EPH'
              ? 'Engineering Physics'
              : 'Science Laboratory Technology',
        href: `/dashboard/undergraduate/${code.toLowerCase()}/overview`,
      })),
    });
  }

  if (postgraduateProgrammes.length > 0) {
    navItems.push({
      label: 'Postgraduate',
      href: '/dashboard/postgraduate',
      children: postgraduateProgrammes.map((code) => ({
        label:
          code === 'PHY'
            ? 'Physics'
            : code === 'EPH'
              ? 'Engineering Physics'
              : 'Science Laboratory Technology',
        href: `/dashboard/postgraduate/${code.toLowerCase()}/overview`,
      })),
    });
  }

  // Research: any RESEARCH_LEAD or superadmin
  if (isAdmin || (await getScopedResearchGroupIds(session)).length > 0) {
    navItems.push({ label: 'Research', href: '/dashboard/research' });
  }

  // Admin: superadmin only
  if (isAdmin) {
    navItems.push({ label: 'Admin', href: '/dashboard/admin' });
  }

  return (
    <>
      <DashboardShell navItems={navItems}>{children}</DashboardShell>
      <Toaster />
    </>
  );
}
