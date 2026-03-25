import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ThesisEntryForm } from '@/components/profile/ThesisEntryForm';

export default async function NewThesisPage() {
  const session = await requireAuth();
  await requireFullProfileTabAccess(session);
  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <div className="p-8 text-center text-muted-foreground">No underlying staff record found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href="/dashboard/profile/thesis-supervision" label="Back to Thesis Supervision" />
        <PageHeader
          title="New Student Thesis"
          description="Add a new student thesis you supervise."
        />
      </div>

      <ThesisEntryForm
        redirectTo="/dashboard/profile/thesis-supervision"
        className="max-w-2xl border bg-card px-6"
      />
    </div>
  );
}
