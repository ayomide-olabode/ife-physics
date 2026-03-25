import { notFound } from 'next/navigation';
import { PageHero } from '@/components/public/PageHero';
import { PeopleCategorySidebar } from '@/components/public/PeopleCategorySidebar';
import { StaffProfileHeader } from '@/components/public/staff-profile/StaffProfileHeader';
import { StaffProfileSection } from '@/components/public/staff-profile/StaffProfileSection';
import { StaffProfileTabs } from '@/components/public/staff-profile/StaffProfileTabs';
import {
  getPublicStaffBySlug,
  type PublicPeopleCategory,
} from '@/server/public/queries/peoplePublic';
import { normalizeStaffProfileTab } from '@/components/public/staff-profile/tabConfig';

function parsePositiveInt(value?: string): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

function getActiveSidebarCategory(staff: {
  staffType: 'ACADEMIC' | 'VISITING' | 'EMERITUS' | 'TECHNICAL' | 'SUPPORT';
  staffStatus: 'ACTIVE' | 'FORMER' | 'RETIRED' | 'IN_MEMORIAM';
  isInMemoriam: boolean;
}): PublicPeopleCategory {
  if (staff.isInMemoriam || staff.staffStatus === 'IN_MEMORIAM') return 'in-memoriam';
  if (staff.staffStatus === 'RETIRED') return 'retired-staff';

  if (staff.staffType === 'ACADEMIC') return 'academic-faculty';
  if (staff.staffType === 'VISITING') return 'visiting-faculty';
  if (staff.staffType === 'EMERITUS') return 'emeritus-faculty';
  if (staff.staffType === 'TECHNICAL') return 'technical-staff';

  return 'support-staff';
}

export default async function StaffProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const staff = await getPublicStaffBySlug(slug);
  if (!staff) notFound();

  const isInMemoriam = staff.isInMemoriam || staff.staffStatus === 'IN_MEMORIAM';
  const activeTab = normalizeStaffProfileTab(query.tab, {
    isInMemoriam,
    staffType: staff.staffType,
  });
  const page = parsePositiveInt(query.page);
  const activeSidebarCategory = getActiveSidebarCategory(staff);

  return (
    <>
      <PageHero breadcrumbLabel="People" title="Faculty Profile" />

      <main className="bg-gray-100 py-14 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
            <PeopleCategorySidebar activeKey={activeSidebarCategory} />

            <section className="space-y-5">
              <StaffProfileHeader staff={staff} />

              <div className="space-y-4 bg-gray-50 p-4">
                <StaffProfileTabs
                  isInMemoriam={isInMemoriam}
                  staffType={staff.staffType}
                  activeTab={activeTab}
                />
                <StaffProfileSection
                  staffId={staff.id}
                  staffSlug={staff.computedStaffSlug}
                  tab={activeTab}
                  isInMemoriam={isInMemoriam}
                  staffType={staff.staffType}
                  page={page}
                  bioHtml={staff.bio}
                  education={staff.education}
                  researchInterests={staff.researchInterests}
                  membershipOfProfessionalOrganizations={
                    staff.membershipOfProfessionalOrganizations
                  }
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
