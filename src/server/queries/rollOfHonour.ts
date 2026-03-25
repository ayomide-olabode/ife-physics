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
      { name: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { middleName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { registrationNumber: { contains: q, mode: 'insensitive' } },
      { programme: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (graduatingYear) {
    where.graduatingYear = graduatingYear;
  }

  if (programme) {
    where.programme = { equals: programme, mode: 'insensitive' };
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
