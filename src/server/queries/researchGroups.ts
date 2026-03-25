import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Session } from 'next-auth';
import { isSuperAdmin, getScopedResearchGroupIds } from '@/lib/rbac';

export interface ListResearchGroupsParams {
  session: Session;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listResearchGroupsForUser({
  session,
  q,
  page = 1,
  pageSize = 10,
}: ListResearchGroupsParams) {
  const where: Prisma.ResearchGroupWhereInput = {
    deletedAt: null,
  };

  // If not superadmin, restrict to scoped groups
  if (!isSuperAdmin(session)) {
    const groupIds = await getScopedResearchGroupIds(session);
    where.id = { in: groupIds };
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { abbreviation: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.researchGroup.findMany({
      where,
      select: {
        id: true,
        name: true,
        abbreviation: true,
        slug: true,
        imageUrl: true,
        heroImageUrl: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.researchGroup.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getResearchGroupByIdForUser({
  session,
  groupId,
}: {
  session: Session;
  groupId: string;
}) {
  // Access check: superadmin or scoped lead
  if (!isSuperAdmin(session)) {
    const groupIds = await getScopedResearchGroupIds(session);
    if (!groupIds.includes(groupId)) {
      return null;
    }
  }

  return prisma.researchGroup.findFirst({
    where: {
      id: groupId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      slug: true,
      imageUrl: true,
      heroImageUrl: true,
      overview: true,
      focusAreas: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          description: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}
