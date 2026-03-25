import { notFound } from 'next/navigation';
import { requireAuth, requireFullProfileTabAccess } from '@/lib/guards';
import { getMyProjectById } from '@/server/queries/profileProjects';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProjectEntryForm } from '@/components/profile/ProjectEntryForm';

export default async function EditProjectPage({
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
  const data = await getMyProjectById({ staffId, id });
  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackToParent href="/dashboard/profile/projects" label="Back to Projects" />
        <PageHeader
          title="Edit Project"
          description="Update the details of this project."
        />
      </div>

      <ProjectEntryForm
        initialData={{
          id: data.id,
          title: data.title,
          acronym: data.acronym || '',
          descriptionHtml: data.descriptionHtml || '',
          url: data.url || '',
          status: data.status,
          isFunded: data.isFunded,
          startYear: data.startYear.toString(),
          endYear: data.endYear ? data.endYear.toString() : '',
        }}
        redirectTo="/dashboard/profile/projects"
        className="max-w-2xl border bg-card px-6"
      />
    </div>
  );
}
