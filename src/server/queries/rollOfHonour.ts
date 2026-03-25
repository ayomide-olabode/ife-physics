import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function listRollOfHonour({
  q,
  graduatingYear,
  programme,
  page = 1,
  pageSize = 10,
}: {
  q?: string;
  graduatingYear?: number;
  programme?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.RollOfHonourEntryWhereInput = {
    deletedAt: null,
  };

  if (q) {
    where.OR = [
      { name: { contains: q} },
      { firstName: { contains: q} },
      { middleName: { contains: q} },
      { lastName: { contains: q} },
      { registrationNumber: { contains: q} },
      { programme: { contains: q} },
    ];
  }

  if (graduatingYear) {
    where.graduatingYear = graduatingYear;
  }

  if (programme) {
    where.programme = { equals: programme};
  }

  const [data, total] = await Promise.all([
    prisma.rollOfHonourEntry.findMany({
      where,
      select: {
        id: true,
        name: true,
        firstName: true,
        middleName: true,
        lastName: true,
        registrationNumber: true,
        programme: true,
        cgpa: true,
        graduatingYear: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: [{ graduatingYear: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.rollOfHonourEntry.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getRollOfHonourById(id: string) {
  return prisma.rollOfHonourEntry.findUnique({
    where: { id },
  });
}
