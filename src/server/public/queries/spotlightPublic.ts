import 'server-only';

import prisma from '@/lib/prisma';
import { wherePublished } from '../published';

/** List published spotlight entries (newest first). */
export async function listPublicSpotlight(limit = 6) {
  return prisma.spotlight.findMany({
    where: wherePublished(),
    select: {
      id: true,
      title: true,
      date: true,
      imageUrl: true,
      text: true,
      updatedAt: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  });
}
