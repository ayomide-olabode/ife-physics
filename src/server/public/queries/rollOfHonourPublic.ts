import 'server-only';

import prisma from '@/lib/prisma';
import { whereNotDeleted } from '../published';
import { paginationArgs, paginatedResult, type PaginationParams } from '../pagination';

interface RollOfHonourParams extends PaginationParams {
  programme?: string;
}

function programmePriority(programme: string): number {
  const normalized = programme.trim().toLowerCase();

  if (normalized === 'physics' || normalized === 'phy') return 0;
  if (normalized === 'engineering physics' || normalized === 'eph') return 1;
  if (
    normalized === 'science laboratory technology' ||
    normalized === 'science lab technology' ||
    normalized === 'slt'
  ) {
    return 2;
  }

  if (normalized.includes('engineering physics')) return 1;
  if (
    normalized.includes('science laboratory technology') ||
    normalized.includes('science lab technology') ||
    normalized.includes('slt')
  ) {
    return 2;
  }
  if (normalized.includes('physics')) return 0;

  return 99;
}

/** Paginated roll of honour (no status field, soft-delete only). */
export async function listPublicRollOfHonour(params: RollOfHonourParams = {}) {
  const { skip, take, page, pageSize } = paginationArgs(params);

  const where = {
    ...whereNotDeleted(),
    ...(params.programme ? { programme: params.programme } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.rollOfHonourEntry.findMany({
      where,
      select: {
        id: true,
        name: true,
        firstName: true,
        middleName: true,
        lastName: true,
        programme: true,
        cgpa: true,
        graduatingYear: true,
        imageUrl: true,
      },
      orderBy: { graduatingYear: 'desc' },
      skip,
      take,
    }),
    prisma.rollOfHonourEntry.count({ where }),
  ]);

  return paginatedResult(items, total, page, pageSize);
}

/** Distinct programmes for filter dropdown. */
export async function listDistinctProgrammes() {
  const rows = await prisma.rollOfHonourEntry.findMany({
    where: whereNotDeleted(),
    distinct: ['programme'],
    select: { programme: true },
    orderBy: { programme: 'asc' },
  });
  return rows.map((r) => r.programme);
}

export type PublicRohEntry = {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  fullName: string;
  registrationNumber: string;
  programme: string;
  degree: string | null;
  cgpa: number;
  profileImageUrl: string | null;
  graduationYear: number;
};

export async function listPublicRohYears(): Promise<number[]> {
  const rows = await prisma.rollOfHonourEntry.findMany({
    where: whereNotDeleted(),
    select: { graduatingYear: true },
    distinct: ['graduatingYear'],
    orderBy: { graduatingYear: 'desc' },
  });

  return rows.map((row) => row.graduatingYear);
}

export async function listPublicRohByYear({
  year,
  take = 24,
  cursor,
}: {
  year: number;
  take?: number;
  cursor?: string | null;
}): Promise<{ entries: PublicRohEntry[]; nextCursor: string | null }> {
  const rows = await prisma.rollOfHonourEntry.findMany({
    where: {
      ...whereNotDeleted(),
      graduatingYear: year,
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      middleName: true,
      lastName: true,
      registrationNumber: true,
      programme: true,
      cgpa: true,
      imageUrl: true,
      graduatingYear: true,
    },
    orderBy: [{ name: 'asc' }],
  });

  const sortedRows = [...rows].sort((a, b) => {
    const programmeDiff = programmePriority(a.programme) - programmePriority(b.programme);
    if (programmeDiff !== 0) return programmeDiff;
    if (a.cgpa !== b.cgpa) return b.cgpa - a.cgpa;
    return a.name.localeCompare(b.name);
  });

  const pageSize = Math.max(1, Math.min(take, 60));
  const startIndex = cursor ? Math.max(0, sortedRows.findIndex((row) => row.id === cursor) + 1) : 0;
  const pageRows = sortedRows.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < sortedRows.length;
  const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null;

  return {
    entries: pageRows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      middleName: row.middleName,
      lastName: row.lastName,
      fullName: row.name,
      registrationNumber: row.registrationNumber,
      programme: row.programme,
      degree: null,
      cgpa: row.cgpa,
      profileImageUrl: row.imageUrl,
      graduationYear: row.graduatingYear,
    })),
    nextCursor,
  };
}
