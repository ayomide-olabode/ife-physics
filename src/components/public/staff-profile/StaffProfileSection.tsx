import Link from 'next/link';
import type { StaffType } from '@prisma/client';
import { Prose } from '@/components/public/Prose';
import { formatDate } from '@/lib/format-date';
import { StaffProjectsByYear } from '@/components/public/staff-profile/StaffProjectsByYear';
import { StaffResearchOutputsByYear } from '@/components/public/staff-profile/StaffResearchOutputsByYear';
import { StudentThesesByYear } from '@/components/public/staff-profile/StudentThesesByYear';
import { StaffTeachingList } from '@/components/public/staff-profile/StaffTeachingList';
import {
  getPublicTributesForStaff,
  listPublicProjectsForStaff,
  listPublicResearchOutputsForStaff,
  listPublicTeachingForStaff,
  listPublicThesesForStaff,
} from '@/server/public/queries/peoplePublic';
import {
  type StaffProfileTab,
  normalizeStaffProfileTab,
} from '@/components/public/staff-profile/tabConfig';

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeHtml(value: string): boolean {
  return /<[^>]+>/.test(value);
}

function ProfileTextBlock({ value }: { value: string }) {
  if (looksLikeHtml(value)) {
    return <Prose html={value} />;
  }
  return <p className="whitespace-pre-line text-base leading-7 text-gray-700">{value}</p>;
}

function buildTabHref(staffSlug: string, tab: StaffProfileTab, page?: number) {
  const params = new URLSearchParams();
  params.set('tab', tab);
  if (page && page > 1) {
    params.set('page', String(page));
  }
  return `/people/staff/${staffSlug}?${params.toString()}`;
}

function SectionPager({
  staffSlug,
  tab,
  prevPage,
  nextPage,
  currentPage,
}: {
  staffSlug: string;
  tab: StaffProfileTab;
  prevPage?: number;
  nextPage?: number;
  currentPage: number;
}) {
  if (!prevPage && !nextPage) return null;

  return (
    <div className="mt-6 flex items-center justify-between pt-4">
      {prevPage ? (
        <Link
          href={buildTabHref(staffSlug, tab, prevPage)}
          className="border border-brand-navy px-4 py-2 text-base font-semibold text-brand-navy hover:bg-brand-navy hover:text-white"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-base text-gray-500">Page {currentPage}</span>
      {nextPage ? (
        <Link
          href={buildTabHref(staffSlug, tab, nextPage)}
          className="border border-brand-navy px-4 py-2 text-base font-semibold text-brand-navy hover:bg-brand-navy hover:text-white"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

export async function StaffProfileSection({
  staffId,
  staffSlug,
  tab,
  isInMemoriam,
  staffType,
  page,
  bioHtml,
  education,
  researchInterests,
  membershipOfProfessionalOrganizations,
}: {
  staffId: string;
  staffSlug: string;
  tab: StaffProfileTab;
  isInMemoriam: boolean;
  staffType: StaffType;
  page: number;
  bioHtml: string | null;
  education: string | null;
  researchInterests: string | null;
  membershipOfProfessionalOrganizations: string | null;
}) {
  const activeTab = normalizeStaffProfileTab(tab, { isInMemoriam, staffType });

  if (activeTab === 'bio') {
    const sections = [
      { title: 'Bio', content: bioHtml },
      { title: 'Education', content: education },
      { title: 'Research Interests', content: researchInterests },
      {
        title: 'Membership of Professional Organizations',
        content: membershipOfProfessionalOrganizations,
      },
    ].filter((section) => Boolean(section.content?.trim()));

    return (
      <section className="bg-white p-6">
        {sections.length > 0 ? (
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={section.title}>
                <article className="space-y-3">
                  <h3 className="text-lg font-semibold text-brand-navy">{section.title}</h3>
                  <ProfileTextBlock value={section.content!.trim()} />
                </article>
                {index < sections.length - 1 && <hr className="mt-8 border-gray-200" />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base text-gray-600">No profile information available yet.</p>
        )}
      </section>
    );
  }

  if (activeTab === 'research-outputs') {
    const data = await listPublicResearchOutputsForStaff(staffId, { page, pageSize: 8 });

    return (
      <section className="bg-white p-6">
        {data.items.length === 0 ? (
          <p className="text-base text-gray-600">No research outputs available.</p>
        ) : (
          <StaffResearchOutputsByYear items={data.items} />
        )}
        <SectionPager
          staffSlug={staffSlug}
          tab={activeTab}
          prevPage={data.prevPage}
          nextPage={data.nextPage}
          currentPage={data.page}
        />
      </section>
    );
  }

  if (activeTab === 'projects') {
    const data = await listPublicProjectsForStaff(staffId, { page: 1, pageSize: 200 });

    return (
      <section className="bg-white p-6">
        {data.items.length === 0 ? (
          <p className="text-base text-gray-600">No projects available.</p>
        ) : (
          <StaffProjectsByYear items={data.items} />
        )}
      </section>
    );
  }

  if (activeTab === 'student-theses') {
    const data = await listPublicThesesForStaff(staffId, { page: 1, pageSize: 200 });
    return (
      <section className="bg-white p-6">
        {data.items.length === 0 ? (
          <p className="text-base text-gray-600">No student theses available.</p>
        ) : (
          <StudentThesesByYear items={data.items} />
        )}
      </section>
    );
  }

  if (activeTab === 'teaching') {
    const data = await listPublicTeachingForStaff(staffId, { page, pageSize: 8 });
    return (
      <section className="bg-white p-6">
        {data.items.length === 0 ? (
          <p className="text-base text-gray-600">No teaching records available.</p>
        ) : (
          <StaffTeachingList records={data.items} />
        )}
        <SectionPager
          staffSlug={staffSlug}
          tab={activeTab}
          prevPage={data.prevPage}
          nextPage={data.nextPage}
          currentPage={data.page}
        />
      </section>
    );
  }

  if (!isInMemoriam) {
    return (
      <section className="bg-white p-6">
        <p className="text-base text-gray-600">No biography available yet.</p>
      </section>
    );
  }

  const data = await getPublicTributesForStaff(staffId, { page, pageSize: 8 });

  return (
    <section className="space-y-6 bg-white p-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-brand-navy">Biography</h3>
        {data.biography ? (
          <div className="border border-gray-200 p-4">
            <h4 className="mb-2 font-semibold text-brand-navy">{data.biography.title}</h4>
            <Prose html={data.biography.bodyHtml} className="prose-sm" />
          </div>
        ) : (
          <p className="text-base text-gray-600">No biography published yet.</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-brand-navy">Public Tributes</h3>
          <Link
            href={`/people/staff/${staffSlug}/tributes/new`}
            className="border border-brand-navy px-4 py-2 text-base font-semibold text-brand-navy hover:bg-brand-navy hover:text-white"
          >
            Write a Tribute
          </Link>
        </div>
        {data.items.length === 0 ? (
          <p className="text-base text-gray-600">No tributes yet.</p>
        ) : (
          <div className="space-y-4">
            {data.items.map((testimonial) => (
              <article key={testimonial.id} className="border border-gray-200 p-4">
                <header className="mb-2 text-base text-gray-600">
                  <span className="font-semibold text-gray-800">{testimonial.name}</span>
                  {testimonial.relationship ? ` (${testimonial.relationship})` : ''}
                  {` • ${formatDate(testimonial.submittedAt)}`}
                </header>
                <p className="line-clamp-3 text-base text-gray-700">
                  {stripHtml(testimonial.tributeHtml)}
                </p>
              </article>
            ))}
            <SectionPager
              staffSlug={staffSlug}
              tab={activeTab}
              prevPage={data.prevPage}
              nextPage={data.nextPage}
              currentPage={data.page}
            />
          </div>
        )}
      </div>
    </section>
  );
}
