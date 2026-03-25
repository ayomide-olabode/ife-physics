'use server';

import prisma from '@/lib/prisma';

export type StaffAuthorResult = {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  institutionalEmail: string;
  profileImageUrl: string | null;
};

/**
 * Search staff records for author autocomplete.
 * Low-bandwidth: limited to `take` results, sorted A–Z by lastName then firstName.
 */
export async function searchStaffAuthors(q: string, take = 10): Promise<StaffAuthorResult[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  return prisma.staff.findMany({
    where: {
      deletedAt: null,
      OR: [
        { institutionalEmail: { contains: trimmed, mode: 'insensitive' } },
        { firstName: { contains: trimmed, mode: 'insensitive' } },
        { middleName: { contains: trimmed, mode: 'insensitive' } },
        { lastName: { contains: trimmed, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      institutionalEmail: true,
      profileImageUrl: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take,
  });
}
