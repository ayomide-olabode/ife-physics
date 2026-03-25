import prisma from '@/lib/prisma';

export async function getDbHealth() {
  try {
    const staffCount = await prisma.staff.count();
    return { ok: true, staffCount };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { ok: false, staffCount: 0 };
  }
}
