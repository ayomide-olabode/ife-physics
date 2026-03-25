import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { getRollOfHonourById } from '@/server/queries/rollOfHonour';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { RollOfHonourFormClient } from '@/components/content/RollOfHonourFormClient';
import { ScopedRole } from '@prisma/client';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const { id } = await params;
  const data = await getRollOfHonourById(id);

  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/content/roll-of-honour" label="Back to Roll of Honour" />
      <PageHeader title="Edit Roll of Honour Entry" description="Update this roll of honour entry." />

      <RollOfHonourFormClient
        initialData={{
          ...data,
          registrationNumber: data.registrationNumber ?? '',
          cgpa: data.cgpa ?? 0,
        }}
      />
    </div>
  );
}
