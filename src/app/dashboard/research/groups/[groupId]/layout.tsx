import { requireAuth, requireResearchLeadForGroup } from '@/lib/guards';

export default async function ResearchGroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const session = await requireAuth();
  const { groupId } = await params;
  await requireResearchLeadForGroup(session, groupId);

  return <>{children}</>;
}
