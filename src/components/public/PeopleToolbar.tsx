'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PublicPeopleCategory } from '@/server/public/queries/peoplePublic';

type ToolbarFilters = {
  rank?: string;
  researchGroupSlug?: string;
  secondaryAffiliationId?: string;
  formerStaffType?: string;
  alpha?: string;
};

type ToolbarFacets = {
  ranks: string[];
  researchGroups: { slug: string; name: string }[];
  affiliations: { id: string; name: string }[];
  formerStaffTypes: string[];
};

type PeopleToolbarProps = {
  category: PublicPeopleCategory;
  initialQuery: string;
  initialSort?: 'default' | 'name-asc' | 'name-desc';
  initialFilters?: ToolbarFilters;
  facets: ToolbarFacets;
};

export function PeopleToolbar({
  category,
  initialQuery,
  initialSort = 'default',
  initialFilters,
  facets,
}: PeopleToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<'default' | 'name-asc' | 'name-desc'>(initialSort);
  const [showFilters, setShowFilters] = useState(false);
  const [rank, setRank] = useState(initialFilters?.rank || '');
  const [researchGroupSlug, setResearchGroupSlug] = useState(
    initialFilters?.researchGroupSlug || '',
  );
  const [secondaryAffiliationId, setSecondaryAffiliationId] = useState(
    initialFilters?.secondaryAffiliationId || '',
  );
  const [formerStaffType, setFormerStaffType] = useState(initialFilters?.formerStaffType || '');
  const [alpha, setAlpha] = useState(initialFilters?.alpha || '');

  const isTechnicalOrSupport = category === 'technical-staff' || category === 'support-staff';
  const isInMemoriam = category === 'in-memoriam';
  const isRetired = category === 'retired-staff';
  const isEmeritus = category === 'emeritus-faculty';
  const showRankFilter = !isInMemoriam && !isEmeritus && !isRetired;
  const showResearchGroupFilter = !isTechnicalOrSupport && !isInMemoriam;
  const showAffiliationFilter =
    !isTechnicalOrSupport && !isInMemoriam && !isEmeritus && !isRetired;
  const showFormerTypeFilter = isInMemoriam || isRetired;

  const hasActiveFilters = Boolean(
    sort !== 'default' ||
      rank ||
      researchGroupSlug ||
      secondaryAffiliationId ||
      formerStaffType ||
      alpha,
  );

  useEffect(() => {
    if (!showFilters) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const inPanel = panelRef.current?.contains(target);
      const inButton = filterButtonRef.current?.contains(target);
      if (!inPanel && !inButton) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showFilters]);

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();

    if (trimmed) params.set('q', trimmed);
    else params.delete('q');

    if (sort === 'default') params.delete('sort');
    else params.set('sort', sort);

    if (showRankFilter && rank) params.set('rank', rank);
    else params.delete('rank');

    if (showResearchGroupFilter && researchGroupSlug) params.set('group', researchGroupSlug);
    else params.delete('group');

    if (showAffiliationFilter && secondaryAffiliationId)
      params.set('affiliation', secondaryAffiliationId);
    else params.delete('affiliation');

    if (showFormerTypeFilter && formerStaffType) params.set('formerType', formerStaffType);
    else params.delete('formerType');

    if (alpha) params.set('alpha', alpha);
    else params.delete('alpha');
    params.delete('hasPhoto');

    params.delete('page');
    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply();
  };

  const clearAll = () => {
    setQuery('');
    setSort('default');
    setRank('');
    setResearchGroupSlug('');
    setSecondaryAffiliationId('');
    setFormerStaffType('');
    setAlpha('');
    router.push(pathname);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          ref={filterButtonRef}
          type="button"
          variant="outline"
          className={`rounded-none border-gray-300 ${hasActiveFilters ? 'bg-brand-navy text-white hover:bg-brand-navy/90 hover:text-white' : ''}`}
          aria-expanded={showFilters}
          aria-controls="people-filters-panel"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </Button>

        <div className="relative w-full sm:w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search faculty"
            className="h-10 rounded-none border-gray-300 pl-9"
            aria-label="Search faculty"
          />
        </div>
      </div>

      {showFilters ? (
        <div
          id="people-filters-panel"
          ref={panelRef}
          className="border border-gray-200 bg-white p-3 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <p className="text-base font-semibold text-brand-navy">Filters</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none px-2"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <label className="text-base text-gray-700" htmlFor="people-sort">
                Sort by
              </label>
              <select
                id="people-sort"
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as 'default' | 'name-asc' | 'name-desc')
                }
                className="h-10 w-full rounded-none border border-gray-300 bg-white px-3 text-base"
              >
                <option value="default">Default</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>

            {showRankFilter ? (
              <div className="space-y-1">
                <label className="text-base text-gray-700" htmlFor="people-rank">
                  Staff rank
                </label>
                <select
                  id="people-rank"
                  value={rank}
                  onChange={(event) => setRank(event.target.value)}
                  className="h-10 w-full rounded-none border border-gray-300 bg-white px-3 text-base"
                >
                  <option value="">All ranks</option>
                  {facets.ranks.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {showResearchGroupFilter ? (
              <div className="space-y-1">
                <label className="text-base text-gray-700" htmlFor="people-group">
                  Research group
                </label>
                <select
                  id="people-group"
                  value={researchGroupSlug}
                  onChange={(event) => setResearchGroupSlug(event.target.value)}
                  className="h-10 w-full rounded-none border border-gray-300 bg-white px-3 text-base"
                >
                  <option value="">All research groups</option>
                  {facets.researchGroups.map((group) => (
                    <option key={group.slug} value={group.slug}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {showAffiliationFilter ? (
              <div className="space-y-1">
                <label className="text-base text-gray-700" htmlFor="people-affiliation">
                  Secondary affiliation
                </label>
                <select
                  id="people-affiliation"
                  value={secondaryAffiliationId}
                  onChange={(event) => setSecondaryAffiliationId(event.target.value)}
                  className="h-10 w-full rounded-none border border-gray-300 bg-white px-3 text-base"
                >
                  <option value="">All affiliations</option>
                  {facets.affiliations.map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {showFormerTypeFilter ? (
              <div className="space-y-1">
                <label className="text-base text-gray-700" htmlFor="people-former-type">
                  {isRetired ? 'Staff category' : 'Former staff category'}
                </label>
                <select
                  id="people-former-type"
                  value={formerStaffType}
                  onChange={(event) => setFormerStaffType(event.target.value)}
                  className="h-10 w-full rounded-none border border-gray-300 bg-white px-3 text-base"
                >
                  <option value="">All categories</option>
                  {facets.formerStaffTypes.map((value) => (
                    <option key={value} value={value}>
                      {value
                        .replace('_', ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-1">
              <label className="text-base text-gray-700" htmlFor="people-alpha">
                Alphabetical grouping
              </label>
              <select
                id="people-alpha"
                value={alpha}
                onChange={(event) => setAlpha(event.target.value)}
                className="h-10 w-full rounded-none border border-gray-300 bg-white px-3 text-base"
              >
                <option value="">All letters</option>
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <Button type="button" variant="outline" className="rounded-none" onClick={clearAll}>
              Clear
            </Button>
            <Button type="button" className="rounded-none" onClick={apply}>
              Apply Filters
            </Button>
          </div>
        </div>
      ) : null}

      {hasActiveFilters ? (
        <div className="flex flex-wrap gap-2">
          {sort !== 'default' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-brand-navy text-white">
              Sort:{' '}
              {sort === 'name-asc' ? 'Name A-Z' : sort === 'name-desc' ? 'Name Z-A' : 'Default'}
            </span>
          ) : null}
          {rank ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-gray-100 text-gray-700">
              Rank: {rank}
            </span>
          ) : null}
          {researchGroupSlug ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-gray-100 text-gray-700">
              Research group selected
            </span>
          ) : null}
          {secondaryAffiliationId ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-gray-100 text-gray-700">
              Affiliation selected
            </span>
          ) : null}
          {formerStaffType ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-gray-100 text-gray-700">
              {isRetired ? 'Staff category' : 'Former category'}:{' '}
              {formerStaffType.replace('_', ' ')}
            </span>
          ) : null}
          {alpha ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-gray-100 text-gray-700">
              Letter: {alpha}
            </span>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
