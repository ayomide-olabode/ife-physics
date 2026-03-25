import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getMyHodAddress } from '@/server/queries/profileHodAddress';
import { HodAddressClientForm } from '@/components/profile/HodAddressClientForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default async function Page() {
  const session = await requireAuth();
  await requireFullProfileTabAccess(session);
  const isSuperAdmin = session.user?.isSuperAdmin === true;
  const sessionStaffId = session.user?.staffId;

  // Find the current active HOD term
  const activeHodTerm = await prisma.leadershipTerm.findFirst({
    where: {
      role: 'HOD',
      endDate: null,
    },
    select: { staffId: true },
  });

  const isSessionHod = sessionStaffId && activeHodTerm?.staffId === sessionStaffId;

  // Only SUPER_ADMIN or the active HOD may access this page
  if (!isSuperAdmin && !isSessionHod) {
    notFound();
  }

  // If there is no active HOD at all, show an empty state
  if (!activeHodTerm) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="HOD Address"
          description="Manage the Head of Department welcome address."
        />
        <EmptyState
          title="No active HOD yet"
          description="Assign an HOD via the admin panel first."
        />
      </div>
    );
  }

  const targetStaffId = activeHodTerm.staffId;
  const existingData = await getMyHodAddress(targetStaffId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="HOD Address"
        description="Manage the Head of Department welcome address."
      />
      <div className="rounded-lg border bg-card p-6">
        <HodAddressClientForm
          initialTitle={existingData?.title}
          initialBody={existingData?.body}
          lastUpdatedAt={existingData?.updatedAt}
        />
      </div>
    </div>
  );
}
