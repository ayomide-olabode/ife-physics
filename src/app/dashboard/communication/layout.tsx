import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

export default async function CommunicationLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireGlobalRole(session, 'EDITOR');

  return (
    <>
      <ModuleTabs
        tabs={[
          { label: 'News', href: '/dashboard/communication/news' },
          {
            label: 'Events & Opportunities',
            href: '/dashboard/communication/events-opportunities',
          },
          { label: 'Spotlight', href: '/dashboard/communication/spotlight' },
        ]}
      />
      {children}
    </>
  );
}
