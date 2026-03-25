import prisma from '@/lib/prisma';
import { PublishStatus } from '.prisma/client';

export async function listNews({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: PublishStatus;
} = {}) {
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        date: true,
        isFeatured: true,
        createdAt: true,
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.news.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getNewsById(id: string) {
  return prisma.news.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      body: true,
      imageUrl: true,
      date: true,
      isFeatured: true,
      buttonLabel: true,
      buttonLink: true,
      status: true,
      publishedAt: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
