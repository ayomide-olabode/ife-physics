import 'server-only';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  buildMonthYearGroups,
  getMonthRangeFromYearMonth,
  type MonthYearGroup,
} from '@/lib/monthYearFilter';
import { wherePublished } from '../published';
import { paginationArgs, paginatedResult, type PaginationParams } from '../pagination';

/** Featured news for homepage hero carousel. */
export async function getFeaturedNews(limit = 4) {
  return prisma.news.findMany({
    where: {
      ...wherePublished(),
      isFeatured: true,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      body: true,
      date: true,
      imageUrl: true,
      buttonLabel: true,
      buttonLink: true,
      updatedAt: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

/** Paginated published news list (no body). */
export async function listPublicNews(
  params: PaginationParams & { q?: string; month?: string } = {},
) {
  const { skip, take, page, pageSize } = paginationArgs(params);
  const where: Prisma.NewsWhereInput = wherePublished();
  const q = params.q?.trim();
  const month = params.month?.trim();
  const andClauses: Prisma.NewsWhereInput[] = [];

  if (q) {
    andClauses.push({
      OR: [
        { title: { contains: q} },
        { body: { contains: q} },
      ],
    });
  }

  const monthRange = getMonthRangeFromYearMonth(month);
  if (monthRange) {
    andClauses.push({
      date: {
        gte: monthRange.start,
        lt: monthRange.end,
      },
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        body: true,
        date: true,
        imageUrl: true,
        updatedAt: true,
      },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.news.count({ where }),
  ]);

  return paginatedResult(items, total, page, pageSize);
}

export async function listPublicNewsMonthGroups(): Promise<MonthYearGroup[]> {
  const rows = await prisma.news.findMany({
    where: wherePublished(),
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  return buildMonthYearGroups(rows.map((row) => row.date));
}

/** Full news detail by slug (includes body). */
export async function getPublicNewsBySlug(slug: string) {
  return prisma.news.findFirst({
    where: { slug, ...wherePublished() },
    select: {
      id: true,
      slug: true,
      title: true,
      body: true,
      imageUrl: true,
      date: true,
      buttonLabel: true,
      buttonLink: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}
