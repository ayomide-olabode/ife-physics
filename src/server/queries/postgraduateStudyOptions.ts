import prisma from '@/lib/prisma';
import { Prisma, ProgrammeCode } from '@prisma/client';

export interface ListPgStudyOptionsParams {
  programmeCode: ProgrammeCode;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listPostgraduateStudyOptions({
  programmeCode,
  q,
  page = 1,
  pageSize = 10,
}: ListPgStudyOptionsParams) {
  const where: Prisma.StudyOptionWhereInput = {
    programs: {
      some: {
        programmeCode,
        level: 'POSTGRADUATE',
      },
    },
    deletedAt: null,
  };

  if (q) {
    where.name = { contains: q, mode: 'insensitive' };
  }

  const [items, total] = await Promise.all([
    prisma.studyOption.findMany({
      where,
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.studyOption.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getPostgraduateStudyOptionById({
  programmeCode,
  id,
}: {
  programmeCode: ProgrammeCode;
  id: string;
}) {
  return prisma.studyOption.findFirst({
    where: {
      id,
      deletedAt: null,
      programs: {
        some: {
          programmeCode,
          level: 'POSTGRADUATE',
        },
      },
    },
    select: {
      id: true,
      name: true,
      about: true,
      courses: {
        select: {
          course: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
        },
        orderBy: {
          course: { code: 'asc' },
        },
      },
    },
  });
}
