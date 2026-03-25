import { requireAuth, requireAnyResearchLead } from '@/lib/guards';

export default async function ResearchLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  await requireAnyResearchLead(session);

  return <>{children}</>;
}
