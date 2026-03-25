import 'server-only';

import prisma from '@/lib/prisma';
import { Prisma, type ResearchOutputType } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { getPublicStaffSlugsByIds } from './peoplePublic';
import { whereNotDeleted } from '../published';
import type { AuthorObject } from '@/lib/researchOutputTypes';
import { formatAuthorsForDisplay } from '@/lib/legacyResearchOutputCompat';
export { getRecentResearchOutputs } from './recentResearchOutputs';

export type PublicResearchGroupHeroDto = {
  title: string;
  abbreviation: string;
  overview: string | null;
  heroImageUrl: string | null;
};

type LinkedAuthor = {
  label: string;
  staffSlug: string | null;
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

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase()}.`)
    .join(' ');
}

function formatSingleAuthorDisplay(author: AuthorObject): string {
  if (author.is_group) {
    const groupName = author.given_name?.trim() || author.family_name?.trim() || '';
    return groupName;
  }

  const family = author.family_name?.trim() || '';
  const initials = toInitials([author.given_name, author.middle_name].filter(Boolean).join(' '));
  return [family, initials].filter(Boolean).join(', ');
}

const listPublicResearchGroupsCached = unstable_cache(
  async () =>
    prisma.researchGroup.findMany({
      where: whereNotDeleted(),
      select: {
        name: true,
        abbreviation: true,
        slug: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' },
    }),
  ['public-research-groups'],
  { tags: ['public:research-groups'] },
);

/** List all research groups (public cards). */
export async function listPublicResearchGroups() {
  return listPublicResearchGroupsCached();
}

/** Full research group detail by slug (public). */
export async function getPublicResearchGroupBySlug(slug: string) {
  const group = await prisma.researchGroup.findFirst({
    where: { slug, ...whereNotDeleted() },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      slug: true,
      heroImageUrl: true,
      overview: true,
      focusAreas: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          description: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      memberships: {
        where: { staff: { deletedAt: null, isPublicProfile: true } },
        select: {
          leftAt: true,
          staff: {
            select: {
              id: true,
              staffStatus: true,
              firstName: true,
              middleName: true,
              lastName: true,
              institutionalEmail: true,
              profileImageUrl: true,
              focusAreaSelections: {
                where: {
                  focusArea: {
                    deletedAt: null,
                    researchGroup: { slug },
                  },
                },
                select: {
                  focusArea: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  const now = new Date();
  const headAssignment = await prisma.roleAssignment.findFirst({
    where: {
      role: 'RESEARCH_LEAD',
      scopeType: 'RESEARCH_GROUP',
      scopeId: group.id,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      user: {
        select: {
          staffId: true,
        },
      },
    },
  });
  const headStaffId = headAssignment?.user.staffId ?? null;

  const hero: PublicResearchGroupHeroDto = {
    title: group.name,
    abbreviation: group.abbreviation,
    overview: group.overview,
    heroImageUrl: group.heroImageUrl,
  };

  const staffIds = Array.from(new Set(group.memberships.map((membership) => membership.staff.id)));
  const slugByStaffId = await getPublicStaffSlugsByIds(staffIds);
  const memberships = group.memberships.map((membership) => ({
    ...membership,
    staff: {
      ...membership.staff,
      computedStaffSlug: slugByStaffId.get(membership.staff.id) ?? null,
      isResearchGroupHead: membership.staff.id === headStaffId,
    },
  }));

  return {
    ...group,
    memberships,
    hero,
  };
}

/** Recent research outputs authored by group members (reuses authorsJson staffId logic). */
export async function listPublicRecentOutputsForGroup(
  groupId: string,
  params?: { page?: number; pageSize?: number; q?: string; type?: ResearchOutputType },
) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, params?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const q = params?.q?.trim() ?? '';
  const outputType = params?.type;

  // Get member staff IDs
  const memberships = await prisma.researchGroupMembership.findMany({
    where: { researchGroupId: groupId, staff: { deletedAt: null, isPublicProfile: true } },
    select: { staffId: true },
  });
  const staffIds = memberships.map((m) => m.staffId);
  if (staffIds.length === 0) {
    return { items: [], total: 0, page, pageSize, hasMore: false };
  }

  const authorsMembershipClause = Prisma.sql`(
    ${Prisma.join(
      staffIds.map(
        (staffId) =>
          Prisma.sql`JSON_CONTAINS(COALESCE(r.\`authorsJson\`, JSON_ARRAY()), JSON_OBJECT('staffId', ${staffId}), '$')`,
      ),
      ' OR ',
    )}
  )`;

  const searchPattern = `%${q.toLowerCase()}%`;

  const searchClause =
    q.length > 0
      ? Prisma.sql`
          AND (
            LOWER(r.title) LIKE ${searchPattern}
            OR LOWER(COALESCE(r.authors, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(r.\`sourceTitle\`, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(r.publisher, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(r.venue, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(CAST(r.year AS CHAR), '')) LIKE ${searchPattern}
          )
        `
      : Prisma.empty;

  const outputTypeClause = outputType ? Prisma.sql`AND r.type = ${outputType}` : Prisma.empty;

  const researchOutputs = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      year: number | null;
      fullDate: Date | null;
      outputType: string;
      authors: string;
      sourceTitle: string | null;
      venue: string | null;
      publisher: string | null;
      metaJson: Prisma.JsonValue | null;
      authorsJson: Prisma.JsonValue | null;
      doi: string | null;
      url: string | null;
    }[]
  >`
    SELECT
      r.id,
      r.title,
      r.year,
      r.\`fullDate\` as fullDate,
      r.type as outputType,
      COALESCE(NULLIF(TRIM(r.authors), ''), 'Unknown author(s)') as authors,
      r.\`sourceTitle\` as sourceTitle,
      r.venue,
      r.publisher,
      r.\`metaJson\` as metaJson,
      r.\`authorsJson\` as authorsJson,
      r.doi,
      r.url
    FROM \`ResearchOutput\` r
    WHERE r.\`deletedAt\` IS NULL
      AND ${authorsMembershipClause}
      ${outputTypeClause}
      ${searchClause}
    ORDER BY
      (r.\`fullDate\` IS NULL) ASC,
      r.\`fullDate\` DESC,
      (r.year IS NULL) ASC,
      r.year DESC,
      r.\`updatedAt\` DESC
    LIMIT ${pageSize}
    OFFSET ${offset};
  `;

  const countRows = await prisma.$queryRaw<{ total: bigint | number }[]>`
    SELECT COUNT(*) as total
    FROM \`ResearchOutput\` r
    WHERE r.\`deletedAt\` IS NULL
      AND ${authorsMembershipClause}
      ${outputTypeClause}
      ${searchClause};
  `;
  const total = Number(countRows[0]?.total ?? 0);
  const authorStaffIds = Array.from(
    new Set(
      researchOutputs.flatMap((output) =>
        parseAuthorsJson(output.authorsJson).flatMap((author) =>
          typeof author.staffId === 'string' && author.staffId.trim() ? [author.staffId.trim()] : [],
        ),
      ),
    ),
  );
  const authorSlugById = await getPublicStaffSlugsByIds(authorStaffIds);

  return {
    items: researchOutputs.map((output) => {
      const parsedAuthors = parseAuthorsJson(output.authorsJson);
      const authorsStructured = parsedAuthors
        .map((author) => ({
          label: formatSingleAuthorDisplay(author),
          staffSlug:
            typeof author.staffId === 'string'
              ? authorSlugById.get(author.staffId.trim()) || null
              : null,
        }))
        .filter((author): author is LinkedAuthor => author.label.trim().length > 0);
      const formattedAuthors = formatAuthorsForDisplay(parsedAuthors);
      return {
        ...output,
        authors: formattedAuthors || output.authors || 'Unknown author(s)',
        authorsStructured,
      };
    }),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
