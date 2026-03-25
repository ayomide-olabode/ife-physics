'use server';

import prisma from '@/lib/prisma';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function createUser({
  staffId,
  isSuperAdmin,
}: {
  staffId: string;
  isSuperAdmin: boolean;
}) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  if (!staffId) {
    return { error: 'Staff ID is required.' };
  }

  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      return { error: 'The specified staff record does not exist.' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { staffId },
    });
    if (existingUser) {
      return { error: 'A user account already exists for this staff member.' };
    }

    const newUser = await prisma.user.create({
      data: {
        staffId,
        passwordHash: '',
        isSuperAdmin,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'CREATE',
      entityType: 'User',
      entityId: newUser.id,
      snapshot: {
        createdUserId: newUser.id,
        staffId: newUser.staffId,
        isSuperAdmin: newUser.isSuperAdmin,
      },
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true, userId: newUser.id };
  } catch (err) {
    console.error('Error creating user:', err);
    return { error: 'An unexpected error occurred while creating the user.' };
  }
}
