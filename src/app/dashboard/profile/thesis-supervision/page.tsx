import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import { listMyTheses } from '@/server/queries/profileTheses';
import { ThesesClientView } from '@/components/profile/ThesesClientView';

export default async function ProfileThesesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireAuth();
  await requireFullProfileTabAccess(session);
  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <div className="p-8 text-center text-muted-foreground">No underlying staff record found.</div>
    );
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const pageSize = 10;

  const data = await listMyTheses({ staffId, page, pageSize });

  return (
    <div className="space-y-6">
      <ThesesClientView data={data} />
    </div>
  );
}
