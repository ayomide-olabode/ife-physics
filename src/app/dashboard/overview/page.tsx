import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getProfileCompleteness } from '@/server/queries/profileCompleteness';
import { ProfileCompletenessCard } from '@/components/dashboard/ProfileCompletenessCard';

export default async function DashboardOverviewPage() {
  const session = await auth();

  const completeness = session?.user?.staffId
    ? await getProfileCompleteness(session.user.staffId)
    : null;
  const staff = session?.user?.staffId
    ? await prisma.staff.findUnique({
        where: { id: session.user.staffId },
        select: {
          title: true,
          firstName: true,
          lastName: true,
        },
      })
    : null;

  const welcomeName =
    [staff?.title, staff?.firstName, staff?.lastName].filter(Boolean).join(' ') ||
    completeness?.displayName ||
    session?.user.staffId ||
    'there';

  return (
    <div className="space-y-6">
      {completeness && <ProfileCompletenessCard completeness={completeness} />}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome {welcomeName}.</p>
      </div>
    </div>
  );
}
