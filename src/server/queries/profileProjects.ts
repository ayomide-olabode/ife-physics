'use server';

import prisma from '@/lib/prisma';

export type ProjectRow = {
  id: string;
  title: string;
  acronym: string | null;
  status: string;
  isFunded: boolean;
  startYear: number;
  endYear: number | null;
  url: string | null;
  createdAt: Date;
};

export async function listMyProjects({
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
    prisma.project.findMany({
      where: {
        staffId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        acronym: true,
        status: true,
        isFunded: true,
        startYear: true,
        endYear: true,
        url: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.project.count({
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

export async function getMyProjectById({ staffId, id }: { staffId: string; id: string }) {
  return prisma.project.findFirst({
    where: {
      id,
      staffId,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      acronym: true,
      descriptionHtml: true,
      status: true,
      isFunded: true,
      startYear: true,
      endYear: true,
      url: true,
    },
  });
}
