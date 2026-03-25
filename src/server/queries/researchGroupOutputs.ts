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

  const authorsMembershipClause =
    staffIds.length > 0
      ? Prisma.sql`(
          ${Prisma.join(
            staffIds.map(
              (staffId) =>
                Prisma.sql`JSON_CONTAINS(COALESCE(r.\`authorsJson\`, JSON_ARRAY()), JSON_OBJECT('staffId', ${staffId}), '$')`,
            ),
            ' OR ',
          )}
        )`
      : Prisma.sql`FALSE`;

  const searchPattern = `%${query.toLowerCase()}%`;

  const searchClause =
    query.length > 0
      ? Prisma.sql`
          AND (
            LOWER(r.title) LIKE ${searchPattern}
            OR LOWER(COALESCE(r.authors, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(r.doi, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(CAST(r.year AS CHAR), '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(r.type, '')) LIKE ${searchPattern}
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
      r.id,
      r.type as outputType,
      r.title,
      COALESCE(NULLIF(TRIM(r.authors), ''), 'Unknown author(s)') as authorsDisplay,
      r.year,
      r.doi,
      r.\`createdAt\` as createdAt
    FROM \`ResearchOutput\` r
    WHERE r.\`deletedAt\` IS NULL
      AND ${authorsMembershipClause}
      ${searchClause}
    ORDER BY (r.year IS NULL) ASC, r.year DESC, r.\`createdAt\` DESC
    LIMIT ${effectivePageSize}
    OFFSET ${offset};
  `;

  const countRows = await prisma.$queryRaw<{ total: bigint | number }[]>`
    SELECT COUNT(*) as total
    FROM \`ResearchOutput\` r
    WHERE r.\`deletedAt\` IS NULL
      AND ${authorsMembershipClause}
      ${searchClause};
  `;

  const totalCount = Number(countRows[0]?.total ?? 0);
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
