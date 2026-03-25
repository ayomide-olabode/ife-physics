import prisma from '@/lib/prisma';

export async function listAllStudyOptions({
  q,
  page = 1,
  pageSize = 100,
  academicProgramId,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
  academicProgramId?: string;
}) {
  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { about: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const items = await prisma.studyOption.findMany({
    where,
    select: {
      id: true,
      name: true,
      about: true,
      slug: true,
      programs: academicProgramId
        ? {
            where: { academicProgramId },
            select: { id: true },
          }
        : false,
    },
    orderBy: { name: 'asc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    about: item.about,
    slug: item.slug,
    isEnabledForProgram: academicProgramId ? item.programs.length > 0 : false,
  }));
}

export async function getProgramStudyOptionIds({ academicProgramId }: { academicProgramId: string }) {
  const links = await prisma.programStudyOption.findMany({
    where: { academicProgramId, studyOption: { deletedAt: null } },
    select: { studyOptionId: true },
    orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
  });

  return links.map((link) => link.studyOptionId);
}

export async function getStudyOptionById(id: string) {
  return prisma.studyOption.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      about: true,
      slug: true,
    },
  });
}
