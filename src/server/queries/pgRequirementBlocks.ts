import prisma from '@/lib/prisma';
import { Prisma, ProgrammeCode, DegreeType, RequirementType } from '@prisma/client';

export interface ListReqBlocksParams {
  programmeCode: ProgrammeCode;
  degreeType: DegreeType;
  requirementType?: RequirementType;
  page?: number;
  pageSize?: number;
}

export async function listRequirementBlocks({
  programmeCode,
  degreeType,
  requirementType,
  page = 1,
  pageSize = 20,
}: ListReqBlocksParams) {
  const where: Prisma.RequirementBlockWhereInput = {
    program: {
      programmeCode,
      level: 'POSTGRADUATE',
    },
    degreeType,
    deletedAt: null,
  };

  if (requirementType) {
    where.requirementType = requirementType;
  }

  const [items, total] = await Promise.all([
    prisma.requirementBlock.findMany({
      where,
      select: {
        id: true,
        title: true,
        requirementType: true,
        orderIndex: true,
        updatedAt: true,
      },
      orderBy: [{ requirementType: 'asc' }, { orderIndex: 'asc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.requirementBlock.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getRequirementBlockById({
  programmeCode,
  degreeType,
  id,
}: {
  programmeCode: ProgrammeCode;
  degreeType: DegreeType;
  id: string;
}) {
  return prisma.requirementBlock.findFirst({
    where: {
      id,
      degreeType,
      deletedAt: null,
      program: {
        programmeCode,
        level: 'POSTGRADUATE',
      },
    },
    select: {
      id: true,
      title: true,
      requirementType: true,
      orderIndex: true,
      contentHtml: true,
    },
  });
}
