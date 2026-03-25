'use server';

import { requireTributesAccess } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const departmentalTributeSchema = z.object({
  staffId: z.string().min(1, 'Staff is required.'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(180, 'Title cannot exceed 180 characters.'),
  bodyHtml: z.string().trim().min(1, 'Tribute body is required.'),
});

type UpsertDepartmentalTributeInput = z.infer<typeof departmentalTributeSchema>;

export async function upsertDepartmentalTribute(input: UpsertDepartmentalTributeInput) {
  const session = await requireTributesAccess();
  const parsed = departmentalTributeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid tribute data.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { staffId, title, bodyHtml } = parsed.data;

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, isInMemoriam: true, staffStatus: true },
  });
  if (!staff) {
    return { success: false, error: 'Staff member not found.' };
  }

  const isInMemoriam = staff.isInMemoriam || staff.staffStatus === 'IN_MEMORIAM';
  if (!isInMemoriam) {
    return { success: false, error: 'Staff member is not marked as in memoriam.' };
  }

  try {
    const tribute = await prisma.departmentalTribute.upsert({
      where: { staffId },
      create: { staffId, title, bodyHtml },
      update: { title, bodyHtml },
      select: { id: true, staffId: true, title: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'DEPARTMENTAL_TRIBUTE_UPDATED',
      entityType: 'DepartmentalTribute',
      entityId: tribute.id,
      snapshot: {
        staffId: tribute.staffId,
        title: tribute.title,
      },
    });

    revalidatePath('/dashboard/content/tributes');
    revalidatePath(`/dashboard/content/tributes/${staffId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to upsert departmental tribute:', error);
    return { success: false, error: 'Failed to save departmental tribute.' };
  }
}
