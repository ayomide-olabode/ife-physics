'use server';

import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';
import { revalidatePath } from 'next/cache';

export async function upsertHodTerm(params: {
  staffId: string;
  startDate: Date;
  endDate?: Date | null;
}) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  const { staffId, startDate, endDate } = params;
  const normalizedStartDate = new Date(startDate);
  const normalizedEndDate = endDate ? new Date(endDate) : null;

  if (normalizedEndDate && normalizedEndDate < normalizedStartDate) {
    return { error: 'End date cannot be before start date.' };
  }

  const targetStaff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!targetStaff) {
    return { error: 'Staff member not found.' };
  }

  try {
    const term = await prisma.$transaction(async (tx) => {
      if (!normalizedEndDate) {
        // Keep only one active HOD by ending any currently active term at the new start date.
        await tx.leadershipTerm.updateMany({
          where: {
            role: 'HOD',
            endDate: null,
          },
          data: {
            endDate: normalizedStartDate,
          },
        });
      }

      return tx.leadershipTerm.create({
        data: {
          staffId,
          role: 'HOD',
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          programmeCode: null,
        },
      });
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'HOD_TERM_UPSERTED',
      entityType: 'LeadershipTerm',
      entityId: term.id,
      snapshot: {
        staffId,
        startDate: normalizedStartDate.toISOString(),
        endDate: normalizedEndDate?.toISOString() ?? null,
      },
    });

    revalidatePath('/dashboard/admin/leadership');
    revalidatePath('/about/leadership');

    return { success: true, termId: term.id };
  } catch (error) {
    console.error('Error upserting HOD term:', error);
    return { error: 'Failed to update HOD term.' };
  }
}

export async function endLeadershipTerm({ termId, endDate }: { termId: string; endDate: Date }) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  const existingTerm = await prisma.leadershipTerm.findUnique({
    where: { id: termId },
  });

  if (!existingTerm) {
    return { error: 'Leadership term not found.' };
  }

  if (new Date(endDate) < new Date(existingTerm.startDate)) {
    return { error: 'End date cannot be before the start date of the term.' };
  }

  try {
    const updated = await prisma.leadershipTerm.update({
      where: { id: termId },
      data: { endDate: new Date(endDate) },
    });

    const snapshot = JSON.parse(JSON.stringify(updated));

    await logAudit({
      actorId: session.user.userId,
      action: 'LEADERSHIP_TERM_ENDED',
      entityType: 'LeadershipTerm',
      entityId: updated.id,
      snapshot,
    });

    revalidatePath('/dashboard/admin/leadership');
    revalidatePath('/about/leadership');

    return { success: true, term: updated };
  } catch (error) {
    console.error('Error ending leadership term:', error);
    return { error: 'Failed to end leadership term.' };
  }
}
