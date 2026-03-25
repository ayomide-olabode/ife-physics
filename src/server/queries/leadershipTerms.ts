import prisma from '@/lib/prisma';
import { Prisma, LeadershipRole } from '@prisma/client';

export async function listLeadershipTerms({
  role,
  activeOnly,
  page = 1,
  pageSize = 20,
}: {
  role?: LeadershipRole;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const skip = (page - 1) * pageSize;

  const where: Prisma.LeadershipTermWhereInput = {};

  if (role) {
    where.role = role;
  }

  if (activeOnly) {
    where.endDate = null;
  }

  const [items, total] = await prisma.$transaction([
    prisma.leadershipTerm.findMany({
      where,
      orderBy: [{ endDate: { sort: 'asc', nulls: 'first' } }, { startDate: 'desc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        role: true,
        startDate: true,
        endDate: true,
        programmeCode: true,
        staffId: true,
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            institutionalEmail: true,
            profileImageUrl: true,
          },
        },
      },
    }),
    prisma.leadershipTerm.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getCurrentHodTerm() {
  return prisma.leadershipTerm.findFirst({
    where: {
      role: 'HOD',
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
    },
    orderBy: [{ endDate: { sort: 'asc', nulls: 'first' } }, { startDate: 'desc' }],
    select: {
      id: true,
      startDate: true,
      endDate: true,
      staff: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          institutionalEmail: true,
          profileImageUrl: true,
          title: true,
          designation: true,
          academicRank: true,
        },
      },
    },
  });
}

export async function listPastHodTerms() {
  return prisma.leadershipTerm.findMany({
    where: { role: 'HOD', endDate: { not: null } },
    orderBy: [{ endDate: 'desc' }, { startDate: 'desc' }],
    select: {
      id: true,
      startDate: true,
      endDate: true,
      staff: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          institutionalEmail: true,
          profileImageUrl: true,
          title: true,
          designation: true,
          academicRank: true,
        },
      },
    },
  });
}
