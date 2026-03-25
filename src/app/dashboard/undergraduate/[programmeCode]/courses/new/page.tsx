import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { requireAcademicAccess } from '@/lib/guards';
import { CourseFormClient } from '@/components/academics/CourseFormClient';

interface PageProps {
  params: Promise<{
    programmeCode: string;
  }>;
}

export default async function NewCoursePage({ params }: PageProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();
  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }
  const programmeCode = codeStr as ProgrammeCode;
  await requireAcademicAccess({ level: 'UNDERGRADUATE', programmeCode });

  return (
    <div className="space-y-6">
      <BackToParent
        href={`/dashboard/undergraduate/${programmeCode.toLowerCase()}/courses`}
        label="Back to Courses"
      />

      <PageHeader
        title={`New Course — ${programmeCode}`}
        description={`Create a course for ${programmeCode}.`}
      />

      <CourseFormClient programmeCode={programmeCode} />
    </div>
  );
}
