'use server';

import prisma from '@/lib/prisma';

export async function searchStaff({ q, take = 20 }: { q: string; take?: number }) {
  if (!q || q.length < 2) return [];

  return prisma.staff.findMany({
    where: {
      deletedAt: null,
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { middleName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { institutionalEmail: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      institutionalEmail: true,
      staffType: true,
      staffStatus: true,
      profileImageUrl: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take,
  });
}
