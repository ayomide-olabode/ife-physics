import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAcademicAccess } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { getUndergraduateProgram } from '@/server/queries/undergraduateProgram';
import { UndergraduateOverviewEditor } from '@/components/academics/ug/UndergraduateOverviewEditor';
import { listAllStudyOptions } from '@/server/queries/studyOptionsUniversal';
import { StudyOptionsInlineEditor } from '@/components/academics/study-options/StudyOptionsInlineEditor';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function UndergraduateProgrammeOverviewPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  await requireAcademicAccess({ level: 'UNDERGRADUATE', programmeCode });

  await searchParams;

  const [programData, programMeta] = await Promise.all([
    getUndergraduateProgram(programmeCode),
    prisma.academicProgram.findUnique({
      where: { programmeCode_level: { programmeCode, level: 'UNDERGRADUATE' } },
      select: { id: true },
    }),
  ]);

  if (!programMeta) {
    notFound();
  }

  const initialOptions = await listAllStudyOptions({
    academicProgramId: programMeta.id,
    page: 1,
    pageSize: 500,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programmeCode} / Overview`}
        description={`Manage overview content for ${programmeCode}.`}
      />

      <div className="rounded-lg border bg-card p-6">
        <UndergraduateOverviewEditor programmeCode={programmeCode} initialData={programData} />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <StudyOptionsInlineEditor
          academicProgramId={programMeta.id}
          initialOptions={initialOptions}
        />
      </div>
    </div>
  );
}
