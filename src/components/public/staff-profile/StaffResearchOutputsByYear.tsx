'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, SquareArrowOutUpRight } from 'lucide-react';
import { RESEARCH_OUTPUT_TYPE_OPTIONS } from '@/lib/options';

type LinkedAuthor = { label: string; staffSlug: string | null };

type ResearchOutputTypeValue = (typeof RESEARCH_OUTPUT_TYPE_OPTIONS)[number]['value'];

type ResearchOutputItem = {
  id: string;
  type: string;
  title: string;
  sourceTitle: string | null;
  venue: string | null;
  publisher: string | null;
  metaJson: unknown;
  year: number | null;
  fullDate: string | Date | null;
  authors: string;
  authorsStructured: LinkedAuthor[];
  doi: string | null;
  url: string | null;
};

type GroupedYear = {
  key: string;
  label: string;
  items: ResearchOutputItem[];
};

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

function getOutputYear(item: ResearchOutputItem) {
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
  if (!item.metaJson || typeof item.metaJson !== 'object' || Array.isArray(item.metaJson)) {
    return null;
  }

  const value = (item.metaJson as Record<string, unknown>)[key];
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

function getCitationParts(item: ResearchOutputItem): {
  source: string | null;
  details: string[];
} {
  const pages = getPages(item);
  const publisher = pickFirst(getMeta(item, 'publisher'), item.publisher);
  const sourceTitle = pickFirst(item.sourceTitle, item.venue, item.publisher);

  switch (item.type) {
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

function renderLinkedAuthors(authorsStructured: LinkedAuthor[], fallbackAuthors: string) {
  if (!authorsStructured.length) {
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

function groupOutputsByYear(items: ResearchOutputItem[]): GroupedYear[] {
  const grouped = new Map<string, ResearchOutputItem[]>();

  for (const item of items) {
    const outputYear = getOutputYear(item);
    const key = outputYear ? String(outputYear) : 'undated';
    const list = grouped.get(key);
    if (list) {
      list.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  const keys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'undated') return 1;
    if (b === 'undated') return -1;
    return Number(b) - Number(a);
  });

  return keys.map((key) => ({
    key,
    label: key === 'undated' ? 'Undated' : key,
    items: grouped.get(key) || [],
  }));
}

export function StaffResearchOutputsByYear({ items }: { items: ResearchOutputItem[] }) {
  const groupedYears = useMemo(() => groupOutputsByYear(items), [items]);
  const [openYear, setOpenYear] = useState<string | null>(groupedYears[0]?.key ?? null);

  return (
    <div className="space-y-3">
      {groupedYears.map((group) => {
        const isOpen = openYear === group.key;

        return (
          <div key={group.key} className="border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenYear((prev) => (prev === group.key ? null : group.key))}
              className="flex w-full items-center justify-between bg-brand-navy px-6 py-4 text-left text-white"
            >
              <span className="text-lg font-semibold">{group.label}</span>
              {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>

            {isOpen ? (
              <div className="bg-white p-6">
                <div className="space-y-4">
                  {group.items.map((output) => {
                    const outputYear = getOutputYear(output);
                    const citationYear = outputYear ?? 'n.d.';
                    const { source, details } = getCitationParts(output);
                    const detailsText = details.join(', ');
                    const linkHref = output.doi ? `https://doi.org/${output.doi}` : output.url;

                    return (
                      <article
                        key={output.id}
                        className="border border-gray-200 bg-white p-4 rounded-none space-y-2"
                      >
                        <p className="text-base font-semibold tracking-wide text-gray-500">
                          {formatOutputType(output.type)}
                        </p>

                        <p className="text-base text-gray-800 leading-relaxed">
                          {renderLinkedAuthors(output.authorsStructured, output.authors)} (
                          {citationYear}): {output.title}
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
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
