import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function listStaff({
  q = '',
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const skip = (page - 1) * pageSize;

  const where: Prisma.StaffWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { middleName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { institutionalEmail: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.staff.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        institutionalEmail: true,
        staffType: true,
        staffStatus: true,
        isPublicProfile: true,
        profileImageUrl: true,
        createdAt: true,
      },
    }),
    prisma.staff.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getStaffById(staffId: string) {
  return prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      institutionalEmail: true,
      staffType: true,
      staffStatus: true,
      isPublicProfile: true,
      profileImageUrl: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          isSuperAdmin: true,
          passwordHash: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      leadershipTerms: {
        select: {
          id: true,
          role: true,
          startDate: true,
          endDate: true,
          programmeCode: true,
        },
        orderBy: { startDate: 'desc' },
      },
    },
  });
}
