import prisma from '@/lib/prisma';
import { Prisma, ProgrammeCode, ProgramLevel } from '@prisma/client';

export interface ListProgramStudyOptionsParams {
  programmeCode: ProgrammeCode;
  level?: ProgramLevel;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listProgramStudyOptions({
  programmeCode,
  level = 'UNDERGRADUATE',
  q,
  page = 1,
  pageSize = 10,
}: ListProgramStudyOptionsParams) {
  const where: Prisma.ProgramStudyOptionWhereInput = {
    programmeCode,
    level,
    studyOption: {
      deletedAt: null,
    },
  };

  if (q) {
    where.studyOption = {
      is: {
        deletedAt: null,
        name: { contains: q, mode: 'insensitive' },
      },
    };
  }

  const [items, total] = await Promise.all([
    prisma.programStudyOption.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        studyOption: {
          select: {
            id: true,
            name: true,
            about: true,
          },
        },
      },
      orderBy: { studyOption: { name: 'asc' } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.programStudyOption.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getProgramStudyOptionById({
  programmeCode,
  level = 'UNDERGRADUATE',
  id,
}: {
  programmeCode: ProgrammeCode;
  level?: ProgramLevel;
  id: string;
}) {
  return prisma.programStudyOption.findFirst({
    where: {
      id,
      programmeCode,
      level,
      studyOption: {
        deletedAt: null,
      },
    },
    include: {
      studyOption: {
        include: {
          courses: {
            where: {
              course: {
                program: { programmeCode, level },
                deletedAt: null,
              },
            },
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
      },
    },
  });
}
