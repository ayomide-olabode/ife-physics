'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const UNDERGRADUATE_TABS = [
  { code: 'phy', label: 'Physics' },
  { code: 'eph', label: 'Engineering Physics' },
  { code: 'slt', label: 'Science Laboratory Technology' },
] as const;

const POSTGRADUATE_TABS = [
  { code: 'phy', label: 'Physics' },
  { code: 'eph', label: 'Engineering Physics' },
] as const;

interface ProgrammeTabsProps {
  activeProgrammeCode: 'phy' | 'eph' | 'slt';
  level?: 'undergraduate' | 'postgraduate';
}

export function ProgrammeTabs({
  activeProgrammeCode,
  level = 'undergraduate',
}: ProgrammeTabsProps) {
  const pathname = usePathname();
  const tabs = level === 'postgraduate' ? POSTGRADUATE_TABS : UNDERGRADUATE_TABS;
  const basePath =
    level === 'postgraduate' ? '/academics/postgraduate' : '/academics/undergraduate';

  return (
    <div className="w-full border-b border-brand-navy md:flex md:flex-wrap">
      {tabs.map((tab) => {
        const tabPath = `${basePath}/${tab.code}`;
        const isActive = pathname?.startsWith(tabPath) || tab.code === activeProgrammeCode;

        return (
          <Link
            key={tab.code}
            href={tabPath}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'block w-full border-b border-brand-navy px-6 py-4 text-center text-base font-semibold uppercase tracking-wide transition-colors md:w-fit md:border-b-0',
              isActive
                ? 'bg-brand-navy text-white'
                : 'bg-white text-brand-navy hover:bg-brand-navy hover:text-white',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
