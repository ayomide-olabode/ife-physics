import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface ListPublicationsParams {
  groupId: string;
  q?: string;
  year?: string;
  page?: number;
  pageSize?: number;
}

export async function listPublicationsForGroup({
  groupId,
  q,
  year,
  page = 1,
  pageSize = 20,
}: ListPublicationsParams) {
  const where: Prisma.PublicationWhereInput = {
    researchGroupId: groupId,
    deletedAt: null,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { authors: { contains: q, mode: 'insensitive' } },
      { venue: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (year) {
    const yr = parseInt(year, 10);
    if (!isNaN(yr)) {
      where.year = yr;
    }
  }

  const [data, total] = await Promise.all([
    prisma.publication.findMany({
      where,
      select: {
        id: true,
        title: true,
        authors: true,
        year: true,
        venue: true,
        doi: true,
        url: true,
        createdAt: true,
      },
      orderBy: [{ year: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.publication.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPublicationByIdForGroup({ groupId, id }: { groupId: string; id: string }) {
  return prisma.publication.findFirst({
    where: {
      id,
      researchGroupId: groupId,
      deletedAt: null,
    },
  });
}
