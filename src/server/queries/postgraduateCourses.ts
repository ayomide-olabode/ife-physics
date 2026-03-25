import prisma from '@/lib/prisma';
import { Prisma, ProgrammeCode, CourseStatus } from '@prisma/client';

export interface ListPgCoursesParams {
  programmeCode: ProgrammeCode;
  q?: string;
  status?: CourseStatus;
  page?: number;
  pageSize?: number;
}

export async function listPostgraduateCourses({
  programmeCode,
  q,
  status,
  page = 1,
  pageSize = 10,
}: ListPgCoursesParams) {
  const where: Prisma.CourseWhereInput = {
    program: {
      programmeCode,
      level: 'POSTGRADUATE',
    },
  };

  if (q) {
    where.OR = [
      { code: { contains: q} },
      { title: { contains: q} },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        L: true,
        T: true,
        P: true,
        U: true,
        semesterTaken: true,
        createdAt: true,
      },
      orderBy: [{ code: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function searchPostgraduateCourses({
  programmeCode,
  q,
  take = 20,
}: {
  programmeCode: ProgrammeCode;
  q?: string;
  take?: number;
}) {
  const where: Prisma.CourseWhereInput = {
    program: {
      programmeCode,
      level: 'POSTGRADUATE',
    },
  };

  if (q) {
    where.OR = [
      { code: { contains: q} },
      { title: { contains: q} },
    ];
  }

  return prisma.course.findMany({
    where,
    select: {
      id: true,
      code: true,
      title: true,
    },
    orderBy: { code: 'asc' },
    take,
  });
}

export async function getPostgraduateCourseForProgramme({
  programmeCode,
  id,
}: {
  programmeCode: ProgrammeCode;
  id: string;
}) {
  return prisma.course.findFirst({
    where: {
      id,
      program: {
        programmeCode,
        level: 'POSTGRADUATE',
      },
    },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      prerequisites: true,
      L: true,
      T: true,
      P: true,
      U: true,
      semesterTaken: true,
      status: true,
    },
  });
}
