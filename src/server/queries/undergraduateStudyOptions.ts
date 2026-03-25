import prisma from '@/lib/prisma';
import { Prisma, ProgrammeCode } from '@prisma/client';

export interface ListStudyOptionsParams {
  programmeCode: ProgrammeCode;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listStudyOptions({
  programmeCode,
  q,
  page = 1,
  pageSize = 10,
}: ListStudyOptionsParams) {
  const where: Prisma.StudyOptionWhereInput = {
    programs: {
      some: {
        programmeCode,
        level: 'UNDERGRADUATE',
      },
    },
    deletedAt: null,
  };

  if (q) {
    where.name = { contains: q};
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

export async function getStudyOptionByIdForProgramme({
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
          level: 'UNDERGRADUATE',
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
