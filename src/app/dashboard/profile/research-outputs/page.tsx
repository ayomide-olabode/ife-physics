import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import { listMyResearchOutputs } from '@/server/queries/profileResearchOutputs';
import { ResearchOutputsClientView } from '@/components/profile/ResearchOutputsClientView';

export default async function ProfileResearchOutputsPage({
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

  const data = await listMyResearchOutputs({ staffId, page, pageSize });

  return (
    <div className="space-y-6">
      <ResearchOutputsClientView data={data} />
    </div>
  );
}
