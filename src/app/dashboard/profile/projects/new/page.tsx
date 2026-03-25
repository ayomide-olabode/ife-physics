import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProjectEntryForm } from '@/components/profile/ProjectEntryForm';

export default async function NewProjectPage() {
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
        <BackToParent href="/dashboard/profile/projects" label="Back to Projects" />
        <PageHeader
          title="New Project"
          description="Add a new project or significant initiative to your profile."
        />
      </div>

      <ProjectEntryForm
        redirectTo="/dashboard/profile/projects"
        className="max-w-2xl border bg-card px-6"
      />
    </div>
  );
}
