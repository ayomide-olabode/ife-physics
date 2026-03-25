import 'server-only';

import prisma from '@/lib/prisma';
import { whereNotDeleted } from '../published';

/** List all resources (no status field, soft-delete only). */
export async function listPublicResources() {
  return prisma.resourceItem.findMany({
    where: whereNotDeleted(),
    select: {
      id: true,
      title: true,
      description: true,
      link: true,
      imageUrl: true,
      category: true,
    },
    orderBy: { title: 'asc' },
  });
}
