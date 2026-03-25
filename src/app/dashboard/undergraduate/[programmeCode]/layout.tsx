import { notFound } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { requireAcademicAccess } from '@/lib/guards';
import { ModuleTabs } from '@/components/dashboard/ModuleTabs';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ programmeCode: string }>;
}

export default async function UndergraduateProgrammeLayout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const codeStr = resolvedParams.programmeCode.toUpperCase();

  if (!['PHY', 'EPH', 'SLT'].includes(codeStr)) {
    notFound();
  }

  const programmeCode = codeStr as ProgrammeCode;
  await requireAcademicAccess({ level: 'UNDERGRADUATE', programmeCode });

  return (
    <div className="space-y-6">
      <ModuleTabs
        tabs={[
          {
            label: 'Overview',
            href: `/dashboard/undergraduate/${programmeCode.toLowerCase()}/overview`,
          },
          {
            label: 'Requirements',
            href: `/dashboard/undergraduate/${programmeCode.toLowerCase()}/requirements`,
          },
          {
            label: 'Courses',
            href: `/dashboard/undergraduate/${programmeCode.toLowerCase()}/courses`,
          },
        ]}
      />
      {children}
    </div>
  );
}
