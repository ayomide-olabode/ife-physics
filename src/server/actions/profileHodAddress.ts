'use server';

import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const hodAddressSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(120, 'Title cannot exceed 120 characters.'),
  body: z.string().min(1, 'Body is required.').max(4000, 'Body cannot exceed 4000 characters.'),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

export async function updateMyHodAddress(
  data: z.infer<typeof hodAddressSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = hodAddressSchema.parse(data);

    const isSuperAdmin = session.user.isSuperAdmin === true;
    const sessionStaffId = session.user.staffId;

    // Find the current active HOD term
    const activeTerm = await prisma.leadershipTerm.findFirst({
      where: {
        role: 'HOD',
        endDate: null,
      },
      select: { id: true, staffId: true },
    });

    if (!activeTerm) {
      return { success: false, error: 'No active HOD term exists.' };
    }

    const isSessionHod = sessionStaffId && activeTerm.staffId === sessionStaffId;

    // Only SUPER_ADMIN or the active HOD may update
    if (!isSuperAdmin && !isSessionHod) {
      return {
        success: false,
        error: 'Unauthorized: You are not the current HOD or a Super Admin.',
      };
    }

    const targetStaffId = activeTerm.staffId;

    const updatedDoc = await prisma.hodAddress.upsert({
      where: { staffId: targetStaffId },
      create: {
        staffId: targetStaffId,
        title: validated.title,
        body: validated.body,
      },
      update: {
        title: validated.title,
        body: validated.body,
      },
      select: { id: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'HOD_ADDRESS_UPDATED',
      entityType: 'HodAddress',
      entityId: updatedDoc.id,
      snapshot: {
        actorUserId: session.user.userId,
        actorStaffId: sessionStaffId,
        targetStaffId,
        termId: activeTerm.id,
        title: validated.title,
      },
    });

    revalidatePath('/dashboard/profile/hod-address');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update HOD address:', error);
    return { success: false, error: 'Database mutation failed.' };
  }
}
