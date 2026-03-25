'use server';

import prisma from '@/lib/prisma';

export async function listResearchGroupOptions() {
  return prisma.researchGroup.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      abbreviation: true,
    },
    orderBy: { name: 'asc' },
  });
}
