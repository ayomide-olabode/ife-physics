import type { StaffType } from '@prisma/client';

export const STAFF_PROFILE_TABS = [
  'tributes',
  'bio',
  'research-outputs',
  'projects',
  'student-theses',
  'teaching',
] as const;

export type StaffProfileTab = (typeof STAFF_PROFILE_TABS)[number];

export function isStaffProfileTab(value: string | undefined): value is StaffProfileTab {
  return !!value && STAFF_PROFILE_TABS.includes(value as StaffProfileTab);
}

const ACADEMIC_STAFF_PROFILE_TABS: StaffProfileTab[] = [
  'bio',
  'research-outputs',
  'projects',
  'student-theses',
  'teaching',
];

const TECHNICAL_SUPPORT_STAFF_PROFILE_TABS: StaffProfileTab[] = ['bio'];

export function getVisibleStaffProfileTabs({
  isInMemoriam,
  staffType,
}: {
  isInMemoriam: boolean;
  staffType: StaffType;
}): StaffProfileTab[] {
  const nonMemoriamTabs =
    staffType === 'TECHNICAL' || staffType === 'SUPPORT'
      ? TECHNICAL_SUPPORT_STAFF_PROFILE_TABS
      : ACADEMIC_STAFF_PROFILE_TABS;

  return isInMemoriam ? (['tributes', ...nonMemoriamTabs] as StaffProfileTab[]) : nonMemoriamTabs;
}

export function getDefaultStaffProfileTab({
  isInMemoriam,
  staffType,
}: {
  isInMemoriam: boolean;
  staffType: StaffType;
}): StaffProfileTab {
  const visibleTabs = getVisibleStaffProfileTabs({ isInMemoriam, staffType });
  return visibleTabs[0] ?? 'bio';
}

export function normalizeStaffProfileTab(
  value: string | undefined,
  {
    isInMemoriam,
    staffType,
  }: {
    isInMemoriam: boolean;
    staffType: StaffType;
  },
): StaffProfileTab {
  const visibleTabs = getVisibleStaffProfileTabs({ isInMemoriam, staffType });
  const defaultTab = getDefaultStaffProfileTab({ isInMemoriam, staffType });
  if (!isStaffProfileTab(value)) return defaultTab;
  if (!visibleTabs.includes(value)) return defaultTab;
  return value;
}

export const STAFF_PROFILE_TAB_LABELS: Record<StaffProfileTab, string> = {
  tributes: 'Tributes',
  bio: 'Bio',
  'research-outputs': 'Research Output',
  projects: 'Projects',
  'student-theses': 'Student Theses',
  teaching: 'Teaching',
};
