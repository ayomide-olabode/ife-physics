import 'server-only';

import prisma from '@/lib/prisma';
import { wherePublished } from '../published';

/** List published history entries in chronological order. */
export async function listPublicHistoryEntries() {
  return prisma.historyEntry.findMany({
    where: wherePublished(),
    select: {
      id: true,
      year: true,
      title: true,
      shortDesc: true,
    },
    orderBy: { year: 'asc' },
  });
}
