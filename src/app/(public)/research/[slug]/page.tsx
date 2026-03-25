import { notFound } from 'next/navigation';
import { FocusAreasGrid } from '@/components/public/research/FocusAreasGrid';
import { GroupScientistsGrid } from '@/components/public/research/GroupScientistsGrid';
import { ResearchGroupHero } from '@/components/public/research/ResearchGroupHero';
import { ResearchOutputsList } from '@/components/public/research/ResearchOutputsList';
import {
  getPublicResearchGroupBySlug,
  listPublicRecentOutputsForGroup,
} from '@/server/public/queries/researchPublic';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const group = await getPublicResearchGroupBySlug(slug);
  if (!group) {
    notFound();
  }

  const initialOutputs = await listPublicRecentOutputsForGroup(group.id, {
    page: 1,
    pageSize: 10,
  });

  const scientists = group.memberships
    .filter((membership) => membership.leftAt === null && membership.staff.staffStatus !== 'FORMER')
    .map((membership) => ({
      ...membership.staff,
      focusAreas: Array.from(
        new Set(
          membership.staff.focusAreaSelections
            .map((selection) => selection.focusArea.title.trim())
            .filter((title) => title.length > 0),
        ),
      ),
    }))
    .sort((a, b) => {
      if (a.isResearchGroupHead && !b.isResearchGroupHead) return -1;
      if (!a.isResearchGroupHead && b.isResearchGroupHead) return 1;
      return `${a.lastName ?? ''} ${a.firstName ?? ''}`.localeCompare(
        `${b.lastName ?? ''} ${b.firstName ?? ''}`,
      );
    });
  const pastMembers = group.memberships
    .filter((membership) => membership.staff.staffStatus === 'FORMER')
    .map((membership) => membership.staff)
    .sort((a, b) =>
      `${a.lastName ?? ''} ${a.firstName ?? ''}`.localeCompare(
        `${b.lastName ?? ''} ${b.firstName ?? ''}`,
      ),
    );

  return (
    <>
      <ResearchGroupHero
        title={group.hero.title}
        abbreviation={group.hero.abbreviation}
        overview={group.hero.overview}
        heroImageUrl={group.hero.heroImageUrl}
      />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-10">
        <section className="space-y-4">
          <div className="bg-brand-navy px-5 py-3">
            <h2 className="text-xl font-serif font-bold text-white">Focus Areas</h2>
          </div>
          <FocusAreasGrid items={group.focusAreas} />
        </section>

        <section className="space-y-4">
          <div className="bg-brand-navy px-5 py-3">
            <h2 className="text-xl font-serif font-bold text-white">Research Group Scientists</h2>
          </div>
          <GroupScientistsGrid scientists={scientists} />
          {pastMembers.length > 0 ? (
            <div className="border border-gray-200 bg-white p-5">
              <h3 className="text-base font-semibold text-brand-navy">Past Members</h3>
              <ul className="mt-3 space-y-2 text-base text-gray-700">
                {pastMembers.map((member) => (
                  <li key={member.id}>
                    {[member.firstName, member.middleName, member.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Unnamed staff member'}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="bg-brand-navy px-5 py-3">
            <h2 className="text-xl font-serif font-bold text-white">Research Outputs</h2>
          </div>
          <ResearchOutputsList groupId={group.id} initial={initialOutputs} />
        </section>
      </main>
    </>
  );
}
