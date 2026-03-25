import prisma from '@/lib/prisma';

export async function searchStudyOptions({ q, take = 10 }: { q: string; take?: number }) {
  return prisma.studyOption.findMany({
    where: {
      name: { contains: q},
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: 'asc',
    },
    take,
  });
}
