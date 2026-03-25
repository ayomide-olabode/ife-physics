import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAcademicAccess } from '@/lib/guards';
import { getPgDegreeContent } from '@/server/queries/pgDegreeContent';
import { PgDegreeContentEditor } from '@/components/academics/PgDegreeContentEditor';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function PhdDegreePage({ params }: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  await requireAcademicAccess({ level: 'POSTGRADUATE', programmeCode });
  const content = await getPgDegreeContent(programmeCode, 'PHD');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programmeCode} / Ph.D.`}
        description="Manage Ph.D. programme content."
      />

      <div className="rounded-lg border bg-card p-6">
        <PgDegreeContentEditor
          programmeCode={programmeCode}
          degreeType="PHD"
          initialData={content}
        />
      </div>
    </div>
  );
}
