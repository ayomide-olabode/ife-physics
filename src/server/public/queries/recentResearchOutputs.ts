import 'server-only';

import type { AuthorObject } from '@/lib/researchOutputTypes';
import prisma from '@/lib/prisma';
import { formatAuthorsForDisplay } from '@/lib/legacyResearchOutputCompat';

export type RecentResearchOutputItem = {
  id: string;
  groupName: string;
  groupSlug: string;
  outputType: string;
  title: string;
  year: number | null;
  hostSource: string | null;
  doi: string | null;
  url: string | null;
  authors: string;
};

const MONTH_NUMBERS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function parseAuthorsJson(value: unknown): AuthorObject[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is AuthorObject => {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      (typeof (entry as { given_name?: unknown }).given_name === 'string' ||
        typeof (entry as { family_name?: unknown }).family_name === 'string')
    );
  });
}

function extractLinkedStaffIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const staffIds: string[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const staffId = (entry as { staffId?: unknown }).staffId;
    if (typeof staffId !== 'string') continue;

    const normalized = staffId.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    staffIds.push(normalized);
  }

  return staffIds;
}

function pickNonEmpty(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function resolveHostSource(output: {
  type: string;
  sourceTitle: string | null;
  venue: string | null;
  publisher: string | null;
  metaJson: unknown;
}): string | null {
  const meta = (output.metaJson && typeof output.metaJson === 'object' ? output.metaJson : {}) as Record<
    string,
    unknown
  >;

  switch (output.type) {
    case 'JOURNAL_ARTICLE':
      return pickNonEmpty(meta.journalName, output.sourceTitle, output.venue);
    case 'BOOK':
    case 'BOOK_CHAPTER':
    case 'MONOGRAPH':
      return pickNonEmpty(meta.publisher, output.publisher, output.sourceTitle);
    case 'DATA':
    case 'SOFTWARE':
      return pickNonEmpty(meta.publisher, output.publisher, output.sourceTitle);
    case 'PATENT':
      return pickNonEmpty(meta.issuer, output.publisher, output.sourceTitle, output.venue);
    case 'REPORT':
    case 'THESIS':
      return pickNonEmpty(meta.institution, output.publisher, output.sourceTitle, output.venue);
    case 'CONFERENCE_PAPER':
      return pickNonEmpty(meta.proceedingsTitle, output.sourceTitle, output.venue, meta.publisher);
    default:
      return pickNonEmpty(output.sourceTitle, output.venue, output.publisher);
  }
}

function toPublicationMonth(metaJson: unknown): number {
  if (!metaJson || typeof metaJson !== 'object') return 0;

  const monthValue = (metaJson as Record<string, unknown>).month;
  if (typeof monthValue !== 'string') return 0;

  const normalized = monthValue.trim().toLowerCase();
  if (!normalized) return 0;

  const numeric = Number.parseInt(normalized, 10);
  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 12) return numeric;

  const short = normalized.slice(0, 3);
  return MONTH_NUMBERS[short] ?? 0;
}

function toPublicationDay(metaJson: unknown): number {
  if (!metaJson || typeof metaJson !== 'object') return 0;

  const dayValue = (metaJson as Record<string, unknown>).day;
  if (typeof dayValue !== 'string') return 0;

  const numeric = Number.parseInt(dayValue.trim(), 10);
  if (Number.isNaN(numeric) || numeric < 1 || numeric > 31) return 0;
  return numeric;
}

/**
 * Fetch recent research outputs for homepage cards.
 * Sorted by publication year/month/day (fallback to updatedAt), irrespective of research groups.
 */
export async function getRecentResearchOutputs(take = 9): Promise<RecentResearchOutputItem[]> {
  const outputs = await prisma.researchOutput.findMany({
    where: {
      deletedAt: null,
      staff: {
        deletedAt: null,
        isPublicProfile: true,
      },
    },
    select: {
      id: true,
      staffId: true,
      type: true,
      title: true,
      year: true,
      fullDate: true,
      sourceTitle: true,
      venue: true,
      publisher: true,
      doi: true,
      url: true,
      authors: true,
      authorsJson: true,
      metaJson: true,
      updatedAt: true,
    },
  });

  const sorted = outputs
    .map((output) => {
      const publicationYear = output.fullDate ? output.fullDate.getUTCFullYear() : (output.year ?? 0);
      const publicationMonth = output.fullDate
        ? output.fullDate.getUTCMonth() + 1
        : toPublicationMonth(output.metaJson);
      const publicationDay = output.fullDate ? output.fullDate.getUTCDate() : toPublicationDay(output.metaJson);

      return {
        output,
        publicationYear,
        publicationMonth,
        publicationDay,
      };
    })
    .sort((a, b) => {
      if (a.publicationYear !== b.publicationYear) return b.publicationYear - a.publicationYear;
      if (a.publicationMonth !== b.publicationMonth) return b.publicationMonth - a.publicationMonth;
      if (a.publicationDay !== b.publicationDay) return b.publicationDay - a.publicationDay;
      return b.output.updatedAt.getTime() - a.output.updatedAt.getTime();
    })
    .slice(0, take);

  const staffIds = Array.from(
    new Set(
      sorted.flatMap(({ output }) => {
        const linkedAuthorStaffIds = extractLinkedStaffIds(output.authorsJson);
        return [...linkedAuthorStaffIds, output.staffId];
      }),
    ),
  );

  const memberships = staffIds.length
    ? await prisma.researchGroupMembership.findMany({
        where: {
          leftAt: null,
          staffId: { in: staffIds },
          researchGroup: {
            deletedAt: null,
          },
        },
        select: {
          staffId: true,
          researchGroup: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [{ staffId: 'asc' }, { researchGroup: { name: 'asc' } }],
      })
    : [];

  const primaryGroupByStaffId = new Map<string, { name: string; slug: string }>();
  for (const membership of memberships) {
    if (!primaryGroupByStaffId.has(membership.staffId)) {
      primaryGroupByStaffId.set(membership.staffId, {
        name: membership.researchGroup.name,
        slug: membership.researchGroup.slug,
      });
    }
  }

  return sorted.map(({ output }) => {
    const authorsJson = parseAuthorsJson(output.authorsJson);
    const formattedAuthors = formatAuthorsForDisplay(authorsJson);
    const linkedAuthorStaffIds = extractLinkedStaffIds(output.authorsJson);
    const orderedStaffIds = linkedAuthorStaffIds.includes(output.staffId)
      ? linkedAuthorStaffIds
      : [...linkedAuthorStaffIds, output.staffId];
    const matchedGroup = orderedStaffIds
      .map((staffId) => primaryGroupByStaffId.get(staffId))
      .find((group): group is { name: string; slug: string } => Boolean(group));

    return {
      id: output.id,
      groupName: matchedGroup?.name ?? 'Research Group',
      groupSlug: matchedGroup?.slug ?? '',
      outputType: output.type,
      title: output.title,
      year: output.fullDate ? output.fullDate.getUTCFullYear() : output.year,
      hostSource: resolveHostSource(output),
      doi: output.doi,
      url: output.url,
      authors: formattedAuthors || output.authors || 'Unknown author(s)',
    };
  });
}
