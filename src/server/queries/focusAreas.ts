import 'server-only';

import prisma from '@/lib/prisma';

export async function listFocusAreasForGroup({ groupId }: { groupId: string }) {
  return prisma.focusArea.findMany({
    where: {
      researchGroupId: groupId,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getFocusAreaById({ id, groupId }: { id: string; groupId: string }) {
  return prisma.focusArea.findFirst({
    where: {
      id,
      researchGroupId: groupId,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });
}
