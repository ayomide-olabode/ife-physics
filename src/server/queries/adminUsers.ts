import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function listUsers({
  q = '',
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = q
    ? {
        staff: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { middleName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { institutionalEmail: { contains: q, mode: 'insensitive' } },
          ],
        },
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        staff: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            institutionalEmail: true,
          },
        },
        roleAssignments: {
          where: {
            deletedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: {
            role: true,
            programmeScope: true,
            degreeScope: true,
            scopeId: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      staffId: true,
      isSuperAdmin: true,
      passwordHash: true,
      lastLoginAt: true,
      createdAt: true,
      staff: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          institutionalEmail: true,
          profileImageUrl: true,
          leadershipTerms: {
            select: {
              id: true,
              role: true,
              startDate: true,
              endDate: true,
              programmeCode: true,
            },
            orderBy: { startDate: 'desc' },
          },
        },
      },
      roleAssignments: {
        select: {
          id: true,
          role: true,
          scopeType: true,
          scopeId: true,
          programmeScope: true,
          degreeScope: true,
          expiresAt: true,
          deletedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}
