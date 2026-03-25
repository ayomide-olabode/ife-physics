import prisma from '@/lib/prisma';

export async function listUserRoleAssignments(userId: string) {
  return prisma.roleAssignment.findMany({
    where: { userId },
    select: {
      id: true,
      role: true,
      scopeType: true,
      scopeId: true,
      programmeScope: true,
      degreeScope: true,
      expiresAt: true,
      deletedAt: true,
      createdAt: true,
    },
    orderBy: [
      { deletedAt: 'asc' }, // active first
      { createdAt: 'desc' },
    ],
  });
}
