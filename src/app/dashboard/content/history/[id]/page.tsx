import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getHistoryById } from '@/server/queries/history';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { HistoryFormClient } from '@/components/content/HistoryFormClient';
import { HistoryStatusActions } from '@/components/content/HistoryStatusActions';
import { ScopedRole } from '@prisma/client';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const data = await getHistoryById(id);

  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/content/history" label="Back to History" />
      <PageHeader title="Edit History Entry" description="Update this history entry." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HistoryFormClient initialData={data} />
        </div>

        <div className="lg:col-span-1 border rounded-lg p-6 bg-white shadow-sm h-fit space-y-4">
          <h3 className="font-semibold text-lg pb-2 border-b">Publishing Workflow</h3>
          <HistoryStatusActions historyId={data.id} currentStatus={data.status} />
        </div>
      </div>
    </div>
  );
}
