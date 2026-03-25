import prisma from '@/lib/prisma';
import { ResearchOutputType, Prisma } from '@prisma/client';

/* ── List query (lean — no metaJson) ── */

export type ResearchOutputRow = {
  id: string;
  type: ResearchOutputType;
  title: string;
  year: number | null;
  sourceTitle: string | null;
  publisher: string | null;
  venue: string | null;
  url: string | null;
  doi: string | null;
  metaJson: Prisma.JsonValue;
  createdAt: Date;
};

export async function listMyResearchOutputs({
  staffId,
  page = 1,
  pageSize = 20,
}: {
  staffId: string;
  page?: number;
  pageSize?: number;
}) {
  const skip = (page - 1) * pageSize;

  const [items, totalCount] = await Promise.all([
    prisma.researchOutput.findMany({
      where: {
        staffId,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        title: true,
        year: true,
        sourceTitle: true,
        publisher: true,
        venue: true,
        url: true,
        doi: true,
        metaJson: true,
        createdAt: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.researchOutput.count({
      where: {
        staffId,
        deletedAt: null,
      },
    }),
  ]);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/* ── Detail query (full record) ── */

export async function getMyResearchOutputById({ staffId, id }: { staffId: string; id: string }) {
  return prisma.researchOutput
    .findFirst({
      where: {
        id,
        staffId,
        deletedAt: null,
      },
    })
    .catch(() => {
      return null;
    });
}
