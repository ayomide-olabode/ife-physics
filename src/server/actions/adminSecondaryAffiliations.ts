'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

const secondaryAffiliationInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  acronym: z.string().trim().max(30, 'Acronym must not exceed 30 characters.').optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters.')
    .optional(),
});

function nullableText(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createSecondaryAffiliation(input: {
  name: string;
  acronym?: string;
  description?: string;
}) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  const parsed = secondaryAffiliationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const data = {
    name: parsed.data.name.trim(),
    acronym: nullableText(parsed.data.acronym),
    description: nullableText(parsed.data.description),
  };

  try {
    const affiliation = await prisma.secondaryAffiliation.create({ data });

    await logAudit({
      actorId: session.user.userId,
      action: 'SECONDARY_AFFILIATION_CREATED',
      entityType: 'SecondaryAffiliation',
      entityId: affiliation.id,
      snapshot: { id: affiliation.id, ...data },
    });

    revalidatePath('/dashboard/admin/secondary-affiliations');
    return { success: true, id: affiliation.id };
  } catch {
    return { error: 'Failed to create secondary affiliation.' };
  }
}

export async function updateSecondaryAffiliation(
  id: string,
  input: { name: string; acronym?: string; description?: string },
) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  if (!id) return { error: 'Affiliation ID is required.' };

  const parsed = secondaryAffiliationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const data = {
    name: parsed.data.name.trim(),
    acronym: nullableText(parsed.data.acronym),
    description: nullableText(parsed.data.description),
  };

  try {
    const affiliation = await prisma.secondaryAffiliation.update({
      where: { id },
      data,
      select: { id: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'SECONDARY_AFFILIATION_UPDATED',
      entityType: 'SecondaryAffiliation',
      entityId: affiliation.id,
      snapshot: { id: affiliation.id, ...data },
    });

    revalidatePath('/dashboard/admin/secondary-affiliations');
    revalidatePath(`/dashboard/admin/secondary-affiliations/${id}`);
    return { success: true, id: affiliation.id };
  } catch {
    return { error: 'Failed to update secondary affiliation.' };
  }
}
