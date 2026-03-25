'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { PublishStatus, ScopedRole } from '@prisma/client';

const MIN_HISTORY_YEAR = 1960;
const CURRENT_YEAR = new Date().getFullYear();

const historySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  year: z
    .number()
    .int()
    .min(MIN_HISTORY_YEAR, `Year must be at least ${MIN_HISTORY_YEAR}`)
    .max(CURRENT_YEAR, `Year must be at most ${CURRENT_YEAR}`),
  shortDesc: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be under 2000 characters'),
});

export async function createHistory(data: z.infer<typeof historySchema>) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);
  const parsed = historySchema.parse(data);

  const entry = await prisma.historyEntry.create({
    data: {
      title: parsed.title,
      year: parsed.year,
      // Keep legacy date field populated for existing consumers.
      date: new Date(Date.UTC(parsed.year, 0, 1)),
      shortDesc: parsed.shortDesc,
      status: PublishStatus.DRAFT,
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'HISTORY_CREATED',
    entityType: 'HistoryEntry',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('history');
  revalidatePath('/about/history');
  revalidatePath('/about');
  revalidatePath('/');

  return entry;
}

export async function updateHistory(id: string, data: z.infer<typeof historySchema>) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);
  const parsed = historySchema.parse(data);

  const entry = await prisma.historyEntry.update({
    where: { id },
    data: {
      title: parsed.title,
      year: parsed.year,
      date: new Date(Date.UTC(parsed.year, 0, 1)),
      shortDesc: parsed.shortDesc,
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'HISTORY_UPDATED',
    entityType: 'HistoryEntry',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('history');
  revalidatePath('/about/history');
  revalidatePath('/about');
  revalidatePath('/');

  return entry;
}

export async function setHistoryStatus(id: string, status: PublishStatus) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const entry = await prisma.historyEntry.update({
    where: { id },
    data: {
      status,
      publishedAt: status === PublishStatus.PUBLISHED ? new Date() : undefined,
      archivedAt: status === PublishStatus.ARCHIVED ? new Date() : undefined,
    },
  });

  let action = 'HISTORY_UPDATED';
  if (status === PublishStatus.PUBLISHED) action = 'HISTORY_PUBLISHED';
  if (status === PublishStatus.DRAFT) action = 'HISTORY_UNPUBLISHED';
  if (status === PublishStatus.ARCHIVED) action = 'HISTORY_ARCHIVED';

  await logAudit({
    actorId: session.user.userId,
    action,
    entityType: 'HistoryEntry',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('history');
  revalidatePath('/about/history');
  revalidatePath('/about');
  revalidatePath('/');

  return entry;
}

export async function deleteHistory(id: string) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const entry = await prisma.historyEntry.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'HISTORY_DELETED',
    entityType: 'HistoryEntry',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('history');
  revalidatePath('/about/history');
  revalidatePath('/about');
  revalidatePath('/');

  return entry;
}
