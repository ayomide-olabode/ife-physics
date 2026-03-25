import 'server-only';

import prisma from '@/lib/prisma';

export async function listSecondaryAffiliationOptions() {
  return prisma.secondaryAffiliation.findMany({
    select: {
      id: true,
      name: true,
      acronym: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getMySecondaryAffiliation(staffId: string) {
  return prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      secondaryAffiliationId: true,
      secondaryAffiliation: {
        select: {
          id: true,
          name: true,
          acronym: true,
        },
      },
    },
  });
}
