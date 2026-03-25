'use server';

import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function updateMySecondaryAffiliation(input: {
  secondaryAffiliationId: string | null;
}) {
  try {
    const session = await requireAuth();
    const staffId = session.user.staffId;

    if (!staffId) {
      return { error: 'No staff record linked to this user.' };
    }

    const nextAffiliationId = input.secondaryAffiliationId;

    if (nextAffiliationId) {
      const exists = await prisma.secondaryAffiliation.findUnique({
        where: { id: nextAffiliationId },
        select: { id: true },
      });
      if (!exists) {
        return { error: 'Selected secondary affiliation does not exist.' };
      }
    }

    const existing = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { secondaryAffiliationId: true },
    });

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        secondaryAffiliationId: nextAffiliationId,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'SECONDARY_AFFILIATION_UPDATED',
      entityType: 'Staff',
      entityId: staffId,
      snapshot: {
        actorUserId: session.user.userId,
        actorStaffId: session.user.staffId,
        targetStaffId: staffId,
        previousSecondaryAffiliationId: existing?.secondaryAffiliationId ?? null,
        secondaryAffiliationId: nextAffiliationId,
      },
    });

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/profile/overview');
    revalidatePath('/dashboard/admin/secondary-affiliations');

    if (existing?.secondaryAffiliationId) {
      revalidatePath(`/dashboard/admin/secondary-affiliations/${existing.secondaryAffiliationId}`);
    }
    if (nextAffiliationId) {
      revalidatePath(`/dashboard/admin/secondary-affiliations/${nextAffiliationId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update secondary affiliation:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
