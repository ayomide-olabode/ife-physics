'use server';

import prisma from '@/lib/prisma';

export async function listMyTeaching({
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
    prisma.teachingResponsibility.findMany({
      where: {
        staffId,
        deletedAt: null,
      },
      select: {
        id: true,
        courseCode: true,
        title: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.teachingResponsibility.count({
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

export async function getMyTeachingById({ staffId, id }: { staffId: string; id: string }) {
  return prisma.teachingResponsibility.findFirst({
    where: {
      id,
      staffId,
      deletedAt: null,
    },
    select: {
      id: true,
      courseCode: true,
      title: true,
    },
  });
}
