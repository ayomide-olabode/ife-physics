import prisma from '@/lib/prisma';
import { Prisma, StaffStatus, TestimonialStatus } from '@prisma/client';

export async function listInMemoriamStaff({
  q = '',
  page = 1,
  pageSize = 10,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;
  const skip = (safePage - 1) * safePageSize;

  const where: Prisma.StaffWhereInput = {
    deletedAt: null,
    OR: [{ isInMemoriam: true }, { staffStatus: StaffStatus.IN_MEMORIAM }],
    ...(q
      ? {
          AND: [
            {
              OR: [
                { firstName: { contains: q} },
                { middleName: { contains: q} },
                { lastName: { contains: q} },
                { institutionalEmail: { contains: q} },
              ],
            },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.staff.findMany({
      where,
      orderBy: [{ dateOfDeath: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: safePageSize,
      select: {
        id: true,
        title: true,
        firstName: true,
        middleName: true,
        lastName: true,
        profileImageUrl: true,
        dateOfBirth: true,
        dateOfDeath: true,
        updatedAt: true,
      },
    }),
    prisma.staff.count({ where }),
  ]);

  return { items, total, page: safePage, pageSize: safePageSize };
}

export async function listTestimonialsForStaff({
  staffId,
  page = 1,
  pageSize = 10,
  status,
}: {
  staffId: string;
  page?: number;
  pageSize?: number;
  status?: TestimonialStatus;
}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;
  const skip = (safePage - 1) * safePageSize;
  const where: Prisma.TributeTestimonialWhereInput = {
    staffId,
    ...(status ? { status } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.tributeTestimonial.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }],
      skip,
      take: safePageSize,
      select: {
        id: true,
        name: true,
        relationship: true,
        tributeHtml: true,
        submittedAt: true,
        status: true,
      },
    }),
    prisma.tributeTestimonial.count({ where }),
  ]);

  return { items, total, page: safePage, pageSize: safePageSize };
}
