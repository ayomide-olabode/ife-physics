import prisma from '@/lib/prisma';
import { Prisma, PublishStatus } from '@prisma/client';

export async function listLegacyGallery(params: {
  q?: string;
  year?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { q, year, status, page = 1, pageSize = 20 } = params;

  const where: Prisma.LegacyGalleryItemWhereInput = {
    deletedAt: null,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { bioText: { contains: q, mode: 'insensitive' } },
      { datesText: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (year) {
    const yr = parseInt(year, 10);
    if (!isNaN(yr)) {
      where.year = yr;
    }
  }

  if (status && status !== 'ALL') {
    // Only apply if it's a valid enum value
    if (Object.values(PublishStatus).includes(status as PublishStatus)) {
      where.status = status as PublishStatus;
    }
  }

  const [data, total] = await Promise.all([
    prisma.legacyGalleryItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        year: true,
        datesText: true,
        mediaUrl: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.legacyGalleryItem.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLegacyGalleryById(id: string) {
  return prisma.legacyGalleryItem.findUnique({
    where: { id, deletedAt: null },
  });
}
