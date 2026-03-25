'use server';

import prisma from '@/lib/prisma';

export async function searchCoursesUniversal(q: string, take = 10) {
  if (!q.trim()) return [];

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { code: { contains: q} },
        { title: { contains: q} },
      ],
    },
    select: {
      id: true,
      code: true,
      title: true,
    },
    orderBy: {
      code: 'asc',
    },
    take,
  });

  return courses;
}
