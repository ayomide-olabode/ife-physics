'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ProgrammeCode } from '@prisma/client';

interface ProgrammeTabsProps {
  programmeCode?: ProgrammeCode;
  basePath: string;
  level?: 'UNDERGRADUATE' | 'POSTGRADUATE';
  allowedProgrammeCodes?: ProgrammeCode[];
  showSectionTabs?: boolean;
}

export function ProgrammeTabs({
  basePath,
  level,
  allowedProgrammeCodes = [],
  showSectionTabs = true,
}: ProgrammeTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Overview', href: `${basePath}/overview` },
    { label: 'Requirements', href: `${basePath}/requirements` },
    { label: 'Courses', href: `${basePath}/courses` },
  ];
  const programmeTabs = allowedProgrammeCodes.map((code) => ({
    label:
      code === ProgrammeCode.PHY
        ? 'Physics'
        : code === ProgrammeCode.EPH
          ? 'Engineering Physics'
          : 'Science Laboratory Technology',
    href: `/dashboard/${level === 'POSTGRADUATE' ? 'postgraduate' : 'undergraduate'}/${code.toLowerCase()}/overview`,
  }));

  return (
    <>
      {programmeTabs.length > 0 && (
        <div className="flex space-x-1 border-b mb-6 overflow-x-auto">
          {programmeTabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href.replace('/overview', ''));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-4 py-2 text-base font-medium border-b-2 whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {showSectionTabs && (
        <div className="flex space-x-1 border-b mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-4 py-2 text-base font-medium border-b-2 whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
