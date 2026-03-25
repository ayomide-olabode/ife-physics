import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function listAuditLogs({
  q,
  actorId,
  entityType,
  page = 1,
  pageSize = 50,
}: {
  q?: string;
  actorId?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
}) {
  const skip = (page - 1) * pageSize;

  const where: Prisma.AuditLogWhereInput = {};

  if (q) {
    where.OR = [
      { action: { contains: q, mode: 'insensitive' } },
      { entityType: { contains: q, mode: 'insensitive' } },
      { entityId: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (actorId) {
    where.actorId = actorId;
  }

  if (entityType) {
    where.entityType = entityType;
  }

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        action: true,
        entityType: true,
        entityId: true,
        actorId: true,
        actor: {
          select: {
            id: true,
            staffId: true,
            isSuperAdmin: true,
            staff: {
              select: {
                firstName: true,
                middleName: true,
                lastName: true,
                institutionalEmail: true,
              },
            },
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getAuditLogSnapshot(auditLogId: string) {
  return prisma.auditLog.findUnique({
    where: { id: auditLogId },
    select: {
      id: true,
      snapshot: true,
      createdAt: true,
      action: true,
      entityType: true,
      entityId: true,
    },
  });
}
