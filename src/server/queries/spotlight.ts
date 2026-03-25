import prisma from '@/lib/prisma';
import { PublishStatus } from '.prisma/client';

export async function listSpotlight({
  page = 1,
  pageSize = 20,
  status,
  q,
}: {
  page?: number;
  pageSize?: number;
  status?: PublishStatus;
  q?: string;
} = {}) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (status) where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { text: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.spotlight.findMany({
      where,
      select: {
        id: true,
        title: true,
        date: true,
        publishedAt: true,
        imageUrl: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.spotlight.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSpotlightById(id: string) {
  return prisma.spotlight.findFirst({
    where: { id, deletedAt: null },
  });
}
