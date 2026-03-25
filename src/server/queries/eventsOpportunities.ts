import prisma from '@/lib/prisma';
import {
  Prisma,
  EventOpportunityType,
  EventCategory,
  OpportunityCategory,
  PublishStatus,
} from '.prisma/client';

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

export async function listEventsOpportunities({
  page = 1,
  pageSize = 20,
  status,
  type,
  eventCategory,
  opportunityCategory,
  q,
}: {
  page?: number;
  pageSize?: number;
  status?: PublishStatus;
  type?: EventOpportunityType;
  eventCategory?: EventCategory;
  opportunityCategory?: OpportunityCategory;
  q?: string;
} = {}) {
  const buildWhere = (includeDurationSearch: boolean): Prisma.EventOpportunityWhereInput => {
    const where: Prisma.EventOpportunityWhereInput = { deletedAt: null };

    if (status) where.status = status;
    if (type) where.type = type;
    if (eventCategory) where.eventCategory = eventCategory;
    if (opportunityCategory) where.opportunityCategory = opportunityCategory;

    if (q) {
      where.OR = [
        { title: { contains: q} },
        ...(includeDurationSearch ? [{ duration: { contains: q } }] : []),
        { venue: { contains: q} },
      ];
    }

    return where;
  };

  let items: Array<{
    id: string;
    title: string;
    type: EventOpportunityType;
    eventCategory: EventCategory | null;
    opportunityCategory: OpportunityCategory | null;
    duration: string | null;
    startDate: Date | null;
    endDate: Date | null;
    venue: string | null;
    deadline: Date | null;
    status: PublishStatus;
    createdAt: Date;
  }>;
  let total: number;

  try {
    const where = buildWhere(true);
    [items, total] = await Promise.all([
      prisma.eventOpportunity.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          eventCategory: true,
          opportunityCategory: true,
          duration: true,
          startDate: true,
          endDate: true,
          venue: true,
          deadline: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.eventOpportunity.count({ where }),
    ]);
  } catch (error) {
    if (!isMissingDurationColumn(error)) {
      throw error;
    }

    const where = buildWhere(false);
    const [fallbackItems, fallbackTotal] = await Promise.all([
      prisma.eventOpportunity.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          eventCategory: true,
          opportunityCategory: true,
          startDate: true,
          endDate: true,
          venue: true,
          deadline: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.eventOpportunity.count({ where }),
    ]);

    items = fallbackItems.map((item) => ({ ...item, duration: null }));
    total = fallbackTotal;
  }

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEventOpportunityById(id: string) {
  const where = { id, deletedAt: null };

  try {
    return await prisma.eventOpportunity.findFirst({
      where,
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
        linkUrl: true,
        deadline: true,
        status: true,
        publishedAt: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  } catch (error) {
    if (!isMissingDurationColumn(error)) {
      throw error;
    }

    const row = await prisma.eventOpportunity.findFirst({
      where,
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
        linkUrl: true,
        deadline: true,
        status: true,
        publishedAt: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return row ? { ...row, duration: null } : null;
  }
}
