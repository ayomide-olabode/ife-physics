import prisma from '@/lib/prisma';
import { PublishStatus } from '@prisma/client';

export async function listHistory({
  q,
  status,
  page = 1,
  pageSize = 10,
}: {
  q?: string;
  status?: PublishStatus | 'ALL';
  page?: number;
  pageSize?: number;
}) {
  const where: import('@prisma/client').Prisma.HistoryEntryWhereInput = {
    deletedAt: null,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { shortDesc: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.historyEntry.findMany({
      where,
      select: {
        id: true,
        title: true,
        year: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.historyEntry.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getHistoryById(id: string) {
  return prisma.historyEntry.findUnique({
    where: { id },
  });
}
