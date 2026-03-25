'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type ThesisRow = {
  id: string;
  year: number;
  title: string;
  studentName: string | null;
  registrationNumber: string | null;
  programme: string | null;
  degreeLevel: string | null;
  externalUrl: string | null;
  status: string;
  createdAt: Date;
};

function isMissingRegistrationNumberColumn(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2022') return false;
  const meta = error.meta as { column?: unknown; modelName?: unknown } | undefined;
  const column = String(meta?.column ?? '').toLowerCase();
  const modelName = String(meta?.modelName ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();

  return (
    column.includes('registrationnumber') ||
    message.includes('registrationnumber') ||
    (modelName.includes('studentthesis') && message.includes('does not exist'))
  );
}

export async function listMyTheses({
  staffId,
  page = 1,
  pageSize = 20,
}: {
  staffId: string;
  page?: number;
  pageSize?: number;
}) {
  const skip = (page - 1) * pageSize;

  const where = {
    staffId,
    deletedAt: null,
  };
  const orderBy = [{ year: 'desc' as const }, { createdAt: 'desc' as const }];

  const totalCountPromise = prisma.studentThesis.count({ where });
  const itemsPromise = prisma.studentThesis.findMany({
    where,
    select: {
      id: true,
      year: true,
      title: true,
      studentName: true,
      registrationNumber: true,
      programme: true,
      degreeLevel: true,
      externalUrl: true,
      status: true,
      createdAt: true,
    },
    orderBy,
    skip,
    take: pageSize,
  });

  let items: ThesisRow[];
  let totalCount: number;
  try {
    [items, totalCount] = await Promise.all([itemsPromise, totalCountPromise]);
  } catch (error) {
    if (!isMissingRegistrationNumberColumn(error)) {
      throw error;
    }

    const [fallbackItems, fallbackTotalCount] = await Promise.all([
      prisma.studentThesis.findMany({
        where,
        select: {
          id: true,
          year: true,
          title: true,
          studentName: true,
          programme: true,
          degreeLevel: true,
          externalUrl: true,
          status: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      totalCountPromise,
    ]);

    items = fallbackItems.map((item) => ({
      ...item,
      registrationNumber: null,
    }));
    totalCount = fallbackTotalCount;
  }

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getMyThesisById({ staffId, id }: { staffId: string; id: string }) {
  const where = {
    id,
    staffId,
    deletedAt: null,
  };

  try {
    return await prisma.studentThesis.findFirst({
      where,
      select: {
        id: true,
        year: true,
        title: true,
        studentName: true,
        registrationNumber: true,
        programme: true,
        degreeLevel: true,
        externalUrl: true,
        status: true,
      },
    });
  } catch (error) {
    if (!isMissingRegistrationNumberColumn(error)) {
      throw error;
    }

    const row = await prisma.studentThesis.findFirst({
      where,
      select: {
        id: true,
        year: true,
        title: true,
        studentName: true,
        programme: true,
        degreeLevel: true,
        externalUrl: true,
        status: true,
      },
    });

    return row ? { ...row, registrationNumber: null } : null;
  }
}
