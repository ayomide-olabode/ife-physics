import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAcademicAccess } from '@/lib/guards';
import { getUndergraduateProgram } from '@/server/queries/undergraduateProgram';
import { UndergraduateRequirementsEditor } from '@/components/academics/ug/UndergraduateRequirementsEditor';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function UndergraduateRequirementsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  await requireAcademicAccess({ level: 'UNDERGRADUATE', programmeCode });
  const programData = await getUndergraduateProgram(programmeCode);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programmeCode} / Requirements`}
        description={`Manage requirements for ${programmeCode}.`}
      />

      <div className="rounded-lg border bg-card p-6">
        <UndergraduateRequirementsEditor programmeCode={programmeCode} initialData={programData} />
      </div>
    </div>
  );
}
