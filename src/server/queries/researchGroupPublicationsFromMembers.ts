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

  // Using jsonb_array_elements on authorsJson safely (coalesce to empty array if null).
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
    SELECT DISTINCT r.id, r.title, r.year, r."sourceTitle", r.publisher, r.venue, r.doi, r.url, r."updatedAt", r.type
    FROM "ResearchOutput" r,
         jsonb_array_elements(COALESCE(r."authorsJson", '[]'::jsonb)) as a
    WHERE r."deletedAt" IS NULL
      AND (a->>'staffId' IN (${Prisma.join(staffIds)}))
    ORDER BY r.year DESC NULLS LAST, r."updatedAt" DESC
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
