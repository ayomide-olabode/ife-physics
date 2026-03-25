import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { requireAcademicAccess } from '@/lib/guards';
import { PGCourseFormClient } from '@/components/academics/PGCourseFormClient';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function NewPGCoursePage({ params }: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;
  await requireAcademicAccess({ level: 'POSTGRADUATE', programmeCode });

  return (
    <div className="space-y-6">
      <BackToParent
        href={`/dashboard/postgraduate/${programmeCode.toLowerCase()}/courses`}
        label="Back to Courses"
      />

      <PageHeader
        title={`New PG Course — ${programmeCode}`}
        description={`Create a course for ${programmeCode}.`}
      />

      <PGCourseFormClient programmeCode={programmeCode} />
    </div>
  );
}
