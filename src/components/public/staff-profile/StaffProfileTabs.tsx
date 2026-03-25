'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { StaffType } from '@prisma/client';
import {
  getVisibleStaffProfileTabs,
  STAFF_PROFILE_TAB_LABELS,
  type StaffProfileTab,
} from '@/components/public/staff-profile/tabConfig';

export function StaffProfileTabs({
  isInMemoriam,
  staffType,
  activeTab,
}: {
  isInMemoriam: boolean;
  staffType: StaffType;
  activeTab: StaffProfileTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const visibleTabs = getVisibleStaffProfileTabs({ isInMemoriam, staffType });

  return (
    <nav className="border border-gray-200 bg-white" aria-label="Profile sections">
      <ul className="flex flex-wrap items-center gap-x-1 px-2 py-1">
        {visibleTabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <li key={tab}>
              <button
                type="button"
                className={[
                  'border-b-2 px-3 py-3 text-base font-semibold transition-colors',
                  isActive
                    ? 'border-brand-navy text-brand-navy'
                    : 'border-transparent text-gray-500 hover:text-brand-navy',
                ].join(' ')}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', tab);
                  params.delete('page');
                  router.push(`${pathname}?${params.toString()}`, { scroll: false });
                }}
              >
                {STAFF_PROFILE_TAB_LABELS[tab]}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
