import prisma from '@/lib/prisma';

export async function getMyHodAddress(staffId: string) {
  return prisma.hodAddress.findUnique({
    where: { staffId },
    select: {
      title: true,
      body: true,
      updatedAt: true,
    },
  });
}
