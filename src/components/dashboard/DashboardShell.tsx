import { DashboardTopbar } from './DashboardTopbar';
import { DashboardSidebar, type NavItem } from './DashboardSidebar';

export function DashboardShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardTopbar navItems={navItems} />
      <div className="mx-auto flex w-full max-w-[1440px] items-start px-4">
        <DashboardSidebar items={navItems} />
        <main className="flex-1 min-w-0 py-6 md:pl-6">{children}</main>
      </div>
    </div>
  );
}
