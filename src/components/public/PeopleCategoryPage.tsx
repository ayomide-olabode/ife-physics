import Link from 'next/link';
import { PageHero } from '@/components/public/PageHero';
import { PeopleCategorySidebar } from '@/components/public/PeopleCategorySidebar';
import { PeopleToolbar } from '@/components/public/PeopleToolbar';
import { StaffCard } from '@/components/public/StaffCard';
import { Button } from '@/components/ui/button';
import {
  getPublicPeopleFilterFacets,
  type PublicPeopleFilters,
  listPublicPeopleByCategory,
  type PublicPeopleCategory,
  type PublicPeopleSort,
} from '@/server/public/queries/peoplePublic';

function parsePositiveInt(value?: string): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

interface PeopleCategoryPageProps {
  title: string;
  category: PublicPeopleCategory;
  searchParams: {
    q?: string;
    page?: string;
    sort?: string;
    rank?: string;
    group?: string;
    affiliation?: string;
    formerType?: string;
    alpha?: string;
  };
}

export async function PeopleCategoryPage({
  title,
  category,
  searchParams,
}: PeopleCategoryPageProps) {
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const page = parsePositiveInt(searchParams.page);
  const sort: PublicPeopleSort =
    searchParams.sort === 'name-asc' || searchParams.sort === 'name-desc'
      ? searchParams.sort
      : 'default';
  const isTechnicalOrSupport = category === 'technical-staff' || category === 'support-staff';
  const isInMemoriam = category === 'in-memoriam';
  const isRetired = category === 'retired-staff';
  const showRankFilter =
    category === 'academic-faculty' ||
    category === 'visiting-faculty' ||
    category === 'emeritus-faculty';
  const showResearchGroupFilter = !isTechnicalOrSupport && !isInMemoriam;
  const showAffiliationFilter = !isTechnicalOrSupport && !isInMemoriam && !isRetired;
  const showFormerTypeFilter = isInMemoriam || isRetired;

  const filters: PublicPeopleFilters = {
    rank: showRankFilter && typeof searchParams.rank === 'string' ? searchParams.rank : undefined,
    researchGroupSlug:
      showResearchGroupFilter && typeof searchParams.group === 'string'
        ? searchParams.group.trim()
        : undefined,
    secondaryAffiliationId:
      showAffiliationFilter && typeof searchParams.affiliation === 'string'
        ? searchParams.affiliation
        : undefined,
    formerStaffType:
      showFormerTypeFilter && typeof searchParams.formerType === 'string'
        ? (searchParams.formerType as PublicPeopleFilters['formerStaffType'])
        : undefined,
    alpha: typeof searchParams.alpha === 'string' ? searchParams.alpha : undefined,
  };
  const pageSize = 9;

  const [{ items, nextPage }, facets] = await Promise.all([
    listPublicPeopleByCategory(category, {
      q,
      sort,
      filters,
      page: 1,
      pageSize: page * pageSize,
    }),
    getPublicPeopleFilterFacets(category),
  ]);

  const loadMoreParams = new URLSearchParams();
  if (q) loadMoreParams.set('q', q);
  if (sort !== 'default') loadMoreParams.set('sort', sort);
  if (filters.rank) loadMoreParams.set('rank', filters.rank);
  if (filters.researchGroupSlug) loadMoreParams.set('group', filters.researchGroupSlug);
  if (filters.secondaryAffiliationId)
    loadMoreParams.set('affiliation', filters.secondaryAffiliationId);
  if (filters.formerStaffType) loadMoreParams.set('formerType', filters.formerStaffType);
  if (filters.alpha) loadMoreParams.set('alpha', filters.alpha);
  loadMoreParams.set('page', String(page + 1));

  return (
    <>
      <PageHero breadcrumbLabel="People" title={title} />

      <main className="py-14 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
            <PeopleCategorySidebar activeKey={category} />

            <section className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-serif font-bold text-brand-navy">{title}</h1>
                <div className="h-px w-full bg-gray-300" aria-hidden="true" />
                <PeopleToolbar
                  category={category}
                  initialQuery={q}
                  initialSort={sort}
                  initialFilters={filters}
                  facets={facets}
                />
              </div>

              {items.length === 0 ? (
                <div className="border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
                  No records found.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <StaffCard key={item.staffId} item={item} />
                    ))}
                  </div>

                  {nextPage && (
                    <div className="pt-2 text-center">
                      <Button asChild className="rounded-none px-8">
                        <Link href={`/people/${category}?${loadMoreParams.toString()}`}>
                          Load More
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
