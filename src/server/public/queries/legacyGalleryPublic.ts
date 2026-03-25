import 'server-only';

import prisma from '@/lib/prisma';
import { wherePublished } from '../published';
import { paginationArgs, paginatedResult, type PaginationParams } from '../pagination';

/** Paginated published legacy gallery items. */
export async function listPublicLegacyGallery(params: PaginationParams = {}) {
  const { skip, take, page, pageSize } = paginationArgs(params);
  const where = wherePublished();

  const [items, total] = await Promise.all([
    prisma.legacyGalleryItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        year: true,
        mediaUrl: true,
        bioText: true,
        datesText: true,
      },
      orderBy: { year: 'desc' },
      skip,
      take,
    }),
    prisma.legacyGalleryItem.count({ where }),
  ]);

  return paginatedResult(items, total, page, pageSize);
}
