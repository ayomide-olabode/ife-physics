import { notFound } from 'next/navigation';
import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import { getMyThesisById } from '@/server/queries/profileTheses';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ThesisEntryForm } from '@/components/profile/ThesisEntryForm';

export default async function EditThesisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  await requireFullProfileTabAccess(session);
  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <div className="p-8 text-center text-muted-foreground">No underlying staff record found.</div>
    );
  }

  const { id } = await params;
  const data = await getMyThesisById({ staffId, id });
  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href="/dashboard/profile/thesis-supervision" label="Back to Thesis Supervision" />
        <PageHeader
          title="Edit Student Thesis"
          description="Update the details of this thesis/dissertation."
        />
      </div>

      <ThesisEntryForm
        initialData={{
          id: data.id,
          year: data.year.toString(),
          title: data.title,
          studentName: data.studentName || '',
          registrationNumber: data.registrationNumber || '',
          programme: data.programme || '',
          degreeLevel: data.degreeLevel || '',
          externalUrl: data.externalUrl || '',
          status: data.status,
        }}
        redirectTo="/dashboard/profile/thesis-supervision"
        className="max-w-2xl border bg-card px-6"
      />
    </div>
  );
}
