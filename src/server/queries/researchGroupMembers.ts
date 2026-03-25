import prisma from '@/lib/prisma';

export async function getResearchGroupMemberStaffIds(groupId: string): Promise<string[]> {
  const memberships = await prisma.researchGroupMembership.findMany({
    where: {
      researchGroupId: groupId,
      staff: {
        deletedAt: null,
      },
      leftAt: null,
    },
    select: {
      staffId: true,
    },
  });

  return memberships.map((m) => m.staffId);
}
