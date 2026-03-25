import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getResearchGroupMemberStaffIds } from './researchGroupMembers';

export type GroupEligibleResearchOutput = {
  id: string;
  title: string;
  year: number | null;
  sourceTitle: string | null;
  doi: string | null;
  url: string | null;
  updatedAt: Date;
  type: string;
};

export type GroupEligiblePublication = GroupEligibleResearchOutput;

export async function listRecentResearchOutputsForGroupMembers({
  groupId,
  take = 20,
}: {
  groupId: string;
  take?: number;
}): Promise<GroupEligibleResearchOutput[]> {
  const staffIds = await getResearchGroupMemberStaffIds(groupId);
  if (staffIds.length === 0) return [];

  const authorsMembershipClause = Prisma.sql`(
    ${Prisma.join(
      staffIds.map(
        (staffId) =>
          Prisma.sql`JSON_CONTAINS(COALESCE(r.\`authorsJson\`, JSON_ARRAY()), JSON_OBJECT('staffId', ${staffId}), '$')`,
      ),
      ' OR ',
    )}
  )`;

  const researchOutputs = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      year: number | null;
      sourceTitle: string | null;
      publisher: string | null;
      venue: string | null;
      doi: string | null;
      url: string | null;
      updatedAt: Date;
      type: string;
    }[]
  >`
    SELECT
      r.id,
      r.title,
      r.year,
      r.\`sourceTitle\` as sourceTitle,
      r.publisher,
      r.venue,
      r.doi,
      r.url,
      r.\`updatedAt\` as updatedAt,
      r.type
    FROM \`ResearchOutput\` r
    WHERE r.\`deletedAt\` IS NULL
      AND ${authorsMembershipClause}
    ORDER BY (r.year IS NULL) ASC, r.year DESC, r.\`updatedAt\` DESC
    LIMIT ${take};
  `;

  return researchOutputs.map((p) => ({
    id: p.id,
    title: p.title,
    year: p.year,
    sourceTitle: p.sourceTitle || p.publisher || p.venue || null,
    doi: p.doi,
    url: p.url,
    updatedAt: p.updatedAt,
    type: p.type,
  }));
}
