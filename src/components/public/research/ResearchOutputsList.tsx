'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, SquareArrowOutUpRight } from 'lucide-react';
import { RESEARCH_OUTPUT_TYPE_OPTIONS } from '@/lib/options';

type LinkedAuthor = { label: string; staffSlug: string | null };

type ResearchOutputItem = {
  id: string;
  title: string;
  year: number | null;
  fullDate: string | Date | null;
  outputType: string;
  authors: string;
  authorsStructured?: LinkedAuthor[];
  sourceTitle: string | null;
  venue: string | null;
  publisher: string | null;
  metaJson: unknown;
  doi: string | null;
  url: string | null;
};

type PaginatedResponse = {
  items: ResearchOutputItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type ResearchOutputTypeValue = (typeof RESEARCH_OUTPUT_TYPE_OPTIONS)[number]['value'];
type OutputTypeFilter = 'ALL' | ResearchOutputTypeValue;

const OUTPUT_TYPE_LABELS = new Map(
  RESEARCH_OUTPUT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

function formatOutputType(outputType: string) {
  const enumLabel = OUTPUT_TYPE_LABELS.get(outputType as ResearchOutputTypeValue);
  if (enumLabel) return enumLabel;

  return outputType
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getYear(item: ResearchOutputItem) {
  if (item.fullDate) {
    return new Date(item.fullDate).getFullYear();
  }
  return item.year;
}

function pickFirst(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function getMeta(item: ResearchOutputItem, key: string): string | null {
  const meta =
    item.metaJson && typeof item.metaJson === 'object' && !Array.isArray(item.metaJson)
      ? (item.metaJson as Record<string, unknown>)
      : null;
  const value = meta?.[key];
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function getPages(item: ResearchOutputItem): string | null {
  const combined = getMeta(item, 'pages');
  if (combined) return combined;

  const from = getMeta(item, 'pagesFrom');
  const to = getMeta(item, 'pagesTo');
  if (from && to) return `${from}-${to}`;
  return from || to || null;
}

function getCitationParts(item: ResearchOutputItem): { source: string | null; details: string[] } {
  const pages = getPages(item);
  const publisher = pickFirst(getMeta(item, 'publisher'), item.publisher);
  const sourceTitle = pickFirst(item.sourceTitle, item.venue, item.publisher);

  switch (item.outputType) {
    case 'JOURNAL_ARTICLE': {
      const source = pickFirst(getMeta(item, 'journalName'), sourceTitle);
      const volume = getMeta(item, 'volume');
      const issue = getMeta(item, 'issue');
      const volumeWithIssue = volume ? `${volume}${issue ? `(${issue})` : ''}` : null;
      return {
        source,
        details: [volumeWithIssue, pages].filter(Boolean) as string[],
      };
    }
    case 'BOOK_CHAPTER': {
      const source = pickFirst(getMeta(item, 'bookTitle'), sourceTitle);
      return {
        source,
        details: [publisher, getMeta(item, 'edition'), getMeta(item, 'city'), pages].filter(
          Boolean,
        ) as string[],
      };
    }
    case 'CONFERENCE_PAPER': {
      const source = pickFirst(getMeta(item, 'proceedingsTitle'), sourceTitle);
      return {
        source,
        details: [publisher, getMeta(item, 'city'), pages].filter(Boolean) as string[],
      };
    }
    case 'BOOK':
    case 'MONOGRAPH': {
      return {
        source: sourceTitle,
        details: [
          publisher,
          getMeta(item, 'edition'),
          getMeta(item, 'volume'),
          getMeta(item, 'city'),
          pages,
        ].filter(Boolean) as string[],
      };
    }
    case 'DATA':
    case 'SOFTWARE': {
      return {
        source: sourceTitle,
        details: [publisher, getMeta(item, 'version')].filter(Boolean) as string[],
      };
    }
    case 'PATENT': {
      const source = pickFirst(getMeta(item, 'issuer'), sourceTitle);
      const number = pickFirst(getMeta(item, 'number'), getMeta(item, 'patentNumber'));
      return {
        source,
        details: [
          number ? `No. ${number}` : null,
          getMeta(item, 'country'),
          getMeta(item, 'assignee'),
          pages,
        ].filter(Boolean) as string[],
      };
    }
    case 'REPORT':
    case 'THESIS': {
      const source = pickFirst(getMeta(item, 'institution'), sourceTitle);
      return {
        source,
        details: [
          getMeta(item, 'thesisType'),
          getMeta(item, 'department'),
          getMeta(item, 'city'),
          pages,
        ].filter(Boolean) as string[],
      };
    }
    default:
      return { source: sourceTitle, details: [pages].filter(Boolean) as string[] };
  }
}

function renderLinkedAuthors(
  authorsStructured: LinkedAuthor[] | undefined,
  fallbackAuthors: string,
) {
  if (!authorsStructured?.length) {
    return fallbackAuthors || 'Unknown author(s)';
  }

  return authorsStructured.map((author, index) => {
    const isBeforeLast = index === authorsStructured.length - 2;
    const isLast = index === authorsStructured.length - 1;
    const separator = isLast ? '' : isBeforeLast ? ' & ' : ', ';

    const content = author.staffSlug ? (
      <Link
        href={`/people/staff/${author.staffSlug}`}
        className="inline-flex items-center gap-1 text-brand-navy hover:underline"
      >
        <span>{author.label}</span>
        <SquareArrowOutUpRight className="h-3.5 w-3.5" />
      </Link>
    ) : (
      author.label
    );

    return (
      <span key={`${author.staffSlug ?? 'na'}-${author.label}-${index}`}>
        {content}
        {separator}
      </span>
    );
  });
}

export function ResearchOutputsList({
  groupId,
  initial,
}: {
  groupId: string;
  initial: PaginatedResponse;
}) {
  const [items, setItems] = useState<ResearchOutputItem[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [activeType, setActiveType] = useState<OutputTypeFilter>('ALL');
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = async (targetPage: number, q: string, type: OutputTypeFilter) => {
    const params = new URLSearchParams();
    params.set('page', String(targetPage));
    if (q.trim()) {
      params.set('q', q.trim());
    }
    if (type !== 'ALL') {
      params.set('type', type);
    }
    const res = await fetch(`/api/public/research/groups/${groupId}/outputs?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch research outputs');
    }
    const payload = (await res.json()) as PaginatedResponse;
    return payload;
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const payload = await fetchPage(1, queryInput, activeType);
      setItems(payload.items);
      setTotal(payload.total);
      setPage(payload.page);
      setHasMore(payload.hasMore);
      setActiveQuery(queryInput.trim());
    } catch {
      // Keep existing results on transient fetch error.
    } finally {
      setSearching(false);
    }
  };

  const handleTypeChange = async (nextType: OutputTypeFilter) => {
    const nextQuery = queryInput.trim();
    try {
      setSearching(true);
      const payload = await fetchPage(1, nextQuery, nextType);
      setItems(payload.items);
      setTotal(payload.total);
      setPage(payload.page);
      setHasMore(payload.hasMore);
      setActiveQuery(nextQuery);
      setActiveType(nextType);
    } catch {
      // Keep existing results on transient fetch error.
    } finally {
      setSearching(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);
      const payload = await fetchPage(page + 1, activeQuery, activeType);
      setItems((prev) => [...prev, ...payload.items]);
      setTotal(payload.total);
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } catch {
      // Keep already-rendered list if next page fetch fails.
    } finally {
      setLoadingMore(false);
    }
  };

  const groupedOutputs = items.reduce(
    (acc, item) => {
      const outputYear = getYear(item);
      const yearLabel = outputYear ? String(outputYear) : 'Undated';

      if (!acc.some((group) => group.yearLabel === yearLabel)) {
        acc.push({ yearLabel, items: [] as ResearchOutputItem[] });
      }
      const group = acc.find((entry) => entry.yearLabel === yearLabel);
      if (group) {
        group.items.push(item);
      }

      return acc;
    },
    [] as Array<{ yearLabel: string; items: ResearchOutputItem[] }>,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex w-full items-center gap-2 rounded-none border border-input px-3 md:w-auto">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <select
            value={activeType}
            onChange={(event) => {
              void handleTypeChange(event.target.value as OutputTypeFilter);
            }}
            className="h-10 w-full bg-transparent text-base text-brand-navy focus:outline-none md:min-w-[210px]"
            aria-label="Filter by research output type"
          >
            <option value="ALL">All Output Types</option>
            {RESEARCH_OUTPUT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-1 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleSearch();
                }
              }}
              placeholder="Search title, authors, year, source..."
              className="pl-9 rounded-none"
            />
          </div>

          <Button
            type="button"
            className="w-fit shrink-0 rounded-none"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      <div className="text-base text-gray-500">
        Showing {items.length} of {total} research outputs
      </div>

      {items.length === 0 ? (
        <div className="border border-gray-200 bg-white p-6 text-base text-gray-500 rounded-none">
          No research outputs found.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedOutputs.map((group) => (
            <div key={group.yearLabel} className="space-y-4">
              <p className="text-base font-semibold text-gray-700">{group.yearLabel}</p>
              <hr className="border-gray-200" />
              <div className="space-y-4">
                {group.items.map((item) => {
                  const year = getYear(item);
                  const citationYear = year ?? 'n.d.';
                  const { source, details } = getCitationParts(item);
                  const detailsText = details.join(', ');
                  const linkHref = item.doi ? `https://doi.org/${item.doi}` : item.url;

                  return (
                    <article
                      key={item.id}
                      className="border border-gray-200 bg-white p-4 rounded-none space-y-2"
                    >
                      <p className="text-base font-semibold tracking-wide text-gray-500">
                        {formatOutputType(item.outputType)}
                      </p>

                      <p className="text-base text-gray-800 leading-relaxed">
                        {renderLinkedAuthors(item.authorsStructured, item.authors)} ({citationYear}
                        ): {item.title}
                        {source ? (
                          <>
                            . - <span className="italic">{source}</span>
                          </>
                        ) : null}
                        {detailsText ? `${source ? ', ' : '. '}${detailsText}` : ''}.
                      </p>

                      {linkHref && (
                        <p className="text-base text-gray-600 break-all">
                          <a
                            href={linkHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-navy hover:underline"
                          >
                            {linkHref}
                          </a>
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
