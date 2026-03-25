import 'server-only';

import { Prisma, type EventOpportunityType } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  buildMonthYearGroups,
  getMonthRangeFromYearMonth,
  type MonthYearGroup,
} from '@/lib/monthYearFilter';
import { wherePublished } from '../published';

type ListPublicEventOpportunitiesParams = {
  limit?: number;
  type?: EventOpportunityType;
  q?: string;
  month?: string;
};

function isMissingDurationColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as {
    code?: unknown;
    message?: unknown;
    meta?: { column?: unknown; modelName?: unknown };
  };

  if (err.code !== 'P2022') return false;

  const column = String(err.meta?.column ?? '').toLowerCase();
  const modelName = String(err.meta?.modelName ?? '').toLowerCase();
  const message = String(err.message ?? '').toLowerCase();

  return (
    column.includes('duration') ||
    message.includes('duration') ||
    (modelName.includes('eventopportunity') && message.includes('does not exist'))
  );
}

/** List published events/opportunities, soonest first, optionally filtered by type. */
export async function listPublicEventOpportunities({
  limit = 10,
  type,
  q,
  month,
}: ListPublicEventOpportunitiesParams = {}) {
  const buildWhere = (includeDurationSearch: boolean): Prisma.EventOpportunityWhereInput => {
    const where: Prisma.EventOpportunityWhereInput = {
      ...wherePublished(),
      ...(type ? { type } : {}),
    };
    const andClauses: Prisma.EventOpportunityWhereInput[] = [];

    if (q?.trim()) {
      const query = q.trim();
      andClauses.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          ...(includeDurationSearch
            ? [{ duration: { contains: query, mode: Prisma.QueryMode.insensitive } }]
            : []),
          { venue: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    const monthRange = getMonthRangeFromYearMonth(month?.trim());
    if (monthRange) {
      andClauses.push({
        OR: [
          { startDate: { gte: monthRange.start, lt: monthRange.end } },
          { endDate: { gte: monthRange.start, lt: monthRange.end } },
          { deadline: { gte: monthRange.start, lt: monthRange.end } },
        ],
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    return where;
  };

  const orderBy: Prisma.EventOpportunityOrderByWithRelationInput[] = [
    { deadline: { sort: 'asc', nulls: 'last' } },
    { startDate: { sort: 'asc', nulls: 'last' } },
    { createdAt: 'desc' },
  ];

  const take = typeof limit === 'number' && limit > 0 ? limit : undefined;

  try {
    return await prisma.eventOpportunity.findMany({
      where: buildWhere(true),
      select: {
        id: true,
        title: true,
        type: true,
        eventCategory: true,
        opportunityCategory: true,
        description: true,
        duration: true,
        startDate: true,
        endDate: true,
        venue: true,
        deadline: true,
        linkUrl: true,
        updatedAt: true,
      },
      orderBy,
      take,
    });
  } catch (error) {
    if (!isMissingDurationColumn(error)) {
      throw error;
    }

    const rows = await prisma.eventOpportunity.findMany({
      where: buildWhere(false),
      select: {
        id: true,
        title: true,
        type: true,
        eventCategory: true,
        opportunityCategory: true,
        description: true,
        startDate: true,
        endDate: true,
        venue: true,
        deadline: true,
        linkUrl: true,
        updatedAt: true,
      },
      orderBy,
      take,
    });

    return rows.map((row) => ({ ...row, duration: null }));
  }
}

/** Backward-compatible alias. */
export async function listPublicEventsOpportunities(
  limitOrParams: number | ListPublicEventOpportunitiesParams = 10,
) {
  if (typeof limitOrParams === 'number') {
    return listPublicEventOpportunities({ limit: limitOrParams });
  }
  return listPublicEventOpportunities(limitOrParams);
}

export async function listPublicEventOpportunityMonthGroups(): Promise<MonthYearGroup[]> {
  const rows = await prisma.eventOpportunity.findMany({
    where: wherePublished(),
    select: {
      startDate: true,
      endDate: true,
      deadline: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return buildMonthYearGroups(
    rows.flatMap((row) => [row.startDate, row.endDate, row.deadline]),
  );
}
