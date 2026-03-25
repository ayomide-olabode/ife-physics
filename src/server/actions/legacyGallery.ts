'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { PublishStatus, ScopedRole } from '@prisma/client';

const legacyGallerySchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  bioText: z.string().min(1, 'Bio text is required').max(4000),
  year: z.coerce.number().optional().nullable(),
  datesText: z.string().max(100).optional().nullable(),
  mediaUrl: z.string().min(1, 'A photo or media upload is required'),
});

export async function createLegacyItem(data: z.infer<typeof legacyGallerySchema>) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);
  const parsed = legacyGallerySchema.parse(data);

  const entry = await prisma.legacyGalleryItem.create({
    data: {
      ...parsed,
      status: PublishStatus.DRAFT,
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'LEGACY_CREATED',
    entityType: 'LegacyGalleryItem',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('legacy-gallery');
  revalidatePath('/about/legacy-gallery');
  revalidatePath('/about');

  return entry;
}

export async function updateLegacyItem(id: string, data: z.infer<typeof legacyGallerySchema>) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);
  const parsed = legacyGallerySchema.parse(data);

  const entry = await prisma.legacyGalleryItem.update({
    where: { id },
    data: parsed,
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'LEGACY_UPDATED',
    entityType: 'LegacyGalleryItem',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('legacy-gallery');
  revalidatePath('/about/legacy-gallery');
  revalidatePath('/about');

  return entry;
}

export async function setLegacyItemStatus(id: string, status: PublishStatus) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const entry = await prisma.legacyGalleryItem.update({
    where: { id },
    data: {
      status,
      publishedAt: status === PublishStatus.PUBLISHED ? new Date() : undefined,
      archivedAt: status === PublishStatus.ARCHIVED ? new Date() : undefined,
    },
  });

  let action = 'LEGACY_UPDATED';
  if (status === PublishStatus.PUBLISHED) action = 'LEGACY_PUBLISHED';
  if (status === PublishStatus.DRAFT) action = 'LEGACY_UNPUBLISHED';
  if (status === PublishStatus.ARCHIVED) action = 'LEGACY_ARCHIVED';

  await logAudit({
    actorId: session.user.userId,
    action,
    entityType: 'LegacyGalleryItem',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('legacy-gallery');
  revalidatePath('/about/legacy-gallery');
  revalidatePath('/about');

  return entry;
}

export async function deleteLegacyItem(id: string) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  const entry = await prisma.legacyGalleryItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'LEGACY_DELETED',
    entityType: 'LegacyGalleryItem',
    entityId: entry.id,
    snapshot: entry,
  });

  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('legacy-gallery');
  revalidatePath('/about/legacy-gallery');
  revalidatePath('/about');

  return entry;
}
