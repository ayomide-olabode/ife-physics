'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { ScopedRole, Prisma } from '@prisma/client';
import { ROH_PROGRAMME_VALUES } from '@/lib/options';

const NAME_MAX_LENGTH = 100;

function collapseNameParts(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const rollOfHonourSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(NAME_MAX_LENGTH, 'First name is too long'),
  middleName: z
    .string()
    .trim()
    .max(NAME_MAX_LENGTH, 'Middle name is too long')
    .optional()
    .nullable(),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(NAME_MAX_LENGTH, 'Last name is too long'),
  registrationNumber: z.string().trim().min(1, 'Registration number is required').max(100),
  programme: z
    .string()
    .trim()
    .min(1, 'Programme is required')
    .refine((val) => ROH_PROGRAMME_VALUES.includes(val as (typeof ROH_PROGRAMME_VALUES)[number]), {
      message: 'Invalid programme',
    }),
  cgpa: z.coerce.number().min(0).max(5),
  graduatingYear: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  imageUrl: z.string().optional().nullable(),
});

export async function createRollOfHonour(data: z.infer<typeof rollOfHonourSchema>) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);
  const parsed = rollOfHonourSchema.parse(data);
  const middleName = parsed.middleName?.trim() ? parsed.middleName.trim() : null;

  const entry = await prisma.rollOfHonourEntry.create({
    data: {
      ...parsed,
      middleName,
      name: collapseNameParts([parsed.firstName, middleName, parsed.lastName]),
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'ROH_CREATED',
    entityType: 'RollOfHonourEntry',
    entityId: entry.id,
    snapshot: entry as unknown as Prisma.InputJsonValue,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('roll-of-honour');
  revalidatePath('/about/roll-of-honour');
  revalidatePath('/about');

  return entry;
}

export async function updateRollOfHonour(id: string, data: z.infer<typeof rollOfHonourSchema>) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);
  const parsed = rollOfHonourSchema.parse(data);
  const middleName = parsed.middleName?.trim() ? parsed.middleName.trim() : null;

  const entry = await prisma.rollOfHonourEntry.update({
    where: { id },
    data: {
      ...parsed,
      middleName,
      name: collapseNameParts([parsed.firstName, middleName, parsed.lastName]),
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'ROH_UPDATED',
    entityType: 'RollOfHonourEntry',
    entityId: entry.id,
    snapshot: entry as unknown as Prisma.InputJsonValue,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('roll-of-honour');
  revalidatePath('/about/roll-of-honour');
  revalidatePath('/about');

  return entry;
}

export async function deleteRollOfHonour(id: string) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const entry = await prisma.rollOfHonourEntry.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'ROH_DELETED',
    entityType: 'RollOfHonourEntry',
    entityId: entry.id,
    snapshot: entry as unknown as Prisma.InputJsonValue,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('roll-of-honour');
  revalidatePath('/about/roll-of-honour');
  revalidatePath('/about');

  return entry;
}
