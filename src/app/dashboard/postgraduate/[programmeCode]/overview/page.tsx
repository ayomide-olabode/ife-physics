import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { requireAcademicAccess } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { getPostgraduateProgram } from '@/server/queries/postgraduateProgram';
import { PostgraduateProgramEditor } from '@/components/academics/PostgraduateProgramEditor';
import { listAllStudyOptions } from '@/server/queries/studyOptionsUniversal';
import { StudyOptionsInlineEditor } from '@/components/academics/study-options/StudyOptionsInlineEditor';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
  searchParams: Promise<{ q?: string; page?: string; studyOptionId?: string }>;
}

export default async function PostgraduateProgrammeOverviewPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  await requireAcademicAccess({ level: 'POSTGRADUATE', programmeCode });

  await searchParams;

  const [programData, programMeta] = await Promise.all([
    getPostgraduateProgram(programmeCode),
    prisma.academicProgram.findUnique({
      where: { programmeCode_level: { programmeCode, level: 'POSTGRADUATE' } },
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
        <PostgraduateProgramEditor programmeCode={programmeCode} initialData={programData} />
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
