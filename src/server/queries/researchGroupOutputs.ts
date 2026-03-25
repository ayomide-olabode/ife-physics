import 'server-only';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getResearchGroupMemberStaffIds } from './researchGroupMembers';

export type ResearchGroupOutputRow = {
  id: string;
  outputType: string;
  title: string;
  authorsDisplay: string;
  year: number | null;
  doi: string | null;
};

export async function listResearchOutputsForGroupMembers({
  groupId,
  limit,
  page = 1,
  pageSize = 20,
  q,
}: {
  groupId: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  const normalizedPage = Math.max(1, page);
  const effectivePageSize = Math.max(1, Math.min(100, limit ?? pageSize));
  const offset = (normalizedPage - 1) * effectivePageSize;
  const query = q?.trim() ?? '';

  const group = await prisma.researchGroup.findFirst({
    where: { id: groupId, deletedAt: null },
    select: { id: true },
  });
  const staffIds = await getResearchGroupMemberStaffIds(groupId);

  if (!group || staffIds.length === 0) {
    return {
      items: [] as ResearchGroupOutputRow[],
      totalCount: 0,
      page: normalizedPage,
      pageSize: effectivePageSize,
      totalPages: 0,
    };
  }

  const searchClause =
    query.length > 0
      ? Prisma.sql`
          AND (
            r.title ILIKE ${`%${query}%`}
            OR COALESCE(r.authors, '') ILIKE ${`%${query}%`}
            OR COALESCE(r.doi, '') ILIKE ${`%${query}%`}
            OR COALESCE(r.year::text, '') ILIKE ${`%${query}%`}
            OR COALESCE(r.type::text, '') ILIKE ${`%${query}%`}
          )
        `
      : Prisma.empty;

  const outputs = await prisma.$queryRaw<
    {
      id: string;
      outputType: string;
      title: string;
      authorsDisplay: string;
      year: number | null;
      doi: string | null;
      createdAt: Date;
    }[]
  >`
    SELECT
      deduped.id,
      deduped."outputType",
      deduped.title,
      deduped."authorsDisplay",
      deduped.year,
      deduped.doi,
      deduped."createdAt"
    FROM (
      SELECT DISTINCT ON (r.id)
        r.id,
        r.type as "outputType",
        r.title,
        COALESCE(NULLIF(BTRIM(r.authors), ''), 'Unknown author(s)') as "authorsDisplay",
        r.year,
        r.doi,
        r."createdAt"
      FROM "ResearchOutput" r,
           jsonb_array_elements(COALESCE(r."authorsJson", '[]'::jsonb)) as a
      WHERE r."deletedAt" IS NULL
        AND (a->>'staffId' IN (${Prisma.join(staffIds)}))
        ${searchClause}
      ORDER BY r.id, r.year DESC NULLS LAST, r."createdAt" DESC
    ) deduped
    ORDER BY deduped.year DESC NULLS LAST, deduped."createdAt" DESC
    LIMIT ${effectivePageSize}
    OFFSET ${offset};
  `;

  const countRows = await prisma.$queryRaw<{ total: number }[]>`
    SELECT COUNT(*)::int as total
    FROM (
      SELECT DISTINCT r.id
      FROM "ResearchOutput" r,
           jsonb_array_elements(COALESCE(r."authorsJson", '[]'::jsonb)) as a
      WHERE r."deletedAt" IS NULL
        AND (a->>'staffId' IN (${Prisma.join(staffIds)}))
        ${searchClause}
    ) deduped;
  `;

  const totalCount = countRows[0]?.total ?? 0;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / effectivePageSize) : 0;

  return {
    items: outputs.map((item) => ({
      id: item.id,
      outputType: item.outputType,
      title: item.title,
      authorsDisplay: item.authorsDisplay,
      year: item.year,
      doi: item.doi,
    })),
    totalCount,
    page: normalizedPage,
    pageSize: effectivePageSize,
    totalPages,
  };
}
