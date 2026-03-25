import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function listSecondaryAffiliations({
  page = 1,
  pageSize = 20,
  q = '',
}: {
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  const skip = (page - 1) * pageSize;

  const where: Prisma.SecondaryAffiliationWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { acronym: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.secondaryAffiliation.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        acronym: true,
        updatedAt: true,
      },
    }),
    prisma.secondaryAffiliation.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSecondaryAffiliationById(id: string) {
  const affiliation = await prisma.secondaryAffiliation.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      acronym: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      staff: {
        where: { deletedAt: null },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          designation: true,
          academicRank: true,
          profileImageUrl: true,
          institutionalEmail: true,
        },
      },
    },
  });

  if (!affiliation) return null;

  return {
    ...affiliation,
    staff: affiliation.staff.map((member) => ({
      ...member,
      slug: member.institutionalEmail,
    })),
  };
}
