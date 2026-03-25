'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { requireAuth, requireResearchLeadForGroup } from '@/lib/guards';
import { isSuperAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

const currentYear = new Date().getFullYear();

const publicationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  authors: z.string().max(2000).optional().nullable(),
  year: z.coerce
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(currentYear + 1, `Year cannot exceed ${currentYear + 1}`)
    .optional()
    .nullable(),
  venue: z.string().max(500).optional().nullable(),
  doi: z.string().max(200).optional().nullable(),
  url: z.string().url('Must be a valid URL').max(2000).optional().nullable().or(z.literal('')),
  abstract: z.string().max(5000).optional().nullable(),
});

type PublicationInput = z.infer<typeof publicationSchema>;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function normalize(val?: string | null): string | null {
  return val && val.trim() !== '' ? val.trim() : null;
}

async function revalidatePublications(groupId: string) {
  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('publications');
  revalidatePath(`/dashboard/research/groups/${groupId}/publications`);
}

async function ensureAccessToGroup(
  session: Awaited<ReturnType<typeof requireAuth>>,
  groupId: string,
) {
  if (!isSuperAdmin(session)) {
    await requireResearchLeadForGroup(session, groupId);
  }
}

export async function createPublication(groupId: string, data: PublicationInput) {
  try {
    const session = await requireAuth();
    await ensureAccessToGroup(session, groupId);

    const validated = publicationSchema.parse(data);

    // Generate unique slug
    const baseSlug = slugify(validated.title);
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.publication.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const publication = await prisma.publication.create({
      data: {
        title: validated.title,
        slug,
        authors: normalize(validated.authors),
        year: validated.year ?? null,
        venue: normalize(validated.venue),
        doi: normalize(validated.doi),
        url: normalize(validated.url),
        abstract: normalize(validated.abstract),
        researchGroupId: groupId,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PUBLICATION_CREATED',
      entityType: 'Publication',
      entityId: publication.id,
      snapshot: validated,
    });

    await revalidatePublications(groupId);

    return { success: true, publicationId: publication.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A research output with this slug or DOI already exists.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create research output' };
  }
}

export async function updatePublication(groupId: string, id: string, data: PublicationInput) {
  try {
    const session = await requireAuth();
    await ensureAccessToGroup(session, groupId);

    const validated = publicationSchema.parse(data);

    const existing = await prisma.publication.findFirst({
      where: { id, researchGroupId: groupId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Research output not found' };
    }

    await prisma.publication.update({
      where: { id },
      data: {
        title: validated.title,
        authors: normalize(validated.authors),
        year: validated.year ?? null,
        venue: normalize(validated.venue),
        doi: normalize(validated.doi),
        url: normalize(validated.url),
        abstract: normalize(validated.abstract),
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PUBLICATION_UPDATED',
      entityType: 'Publication',
      entityId: id,
      snapshot: validated,
    });

    await revalidatePublications(groupId);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A research output with this DOI already exists.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update research output' };
  }
}

export async function deletePublication(groupId: string, id: string) {
  try {
    const session = await requireAuth();
    await ensureAccessToGroup(session, groupId);

    const existing = await prisma.publication.findFirst({
      where: { id, researchGroupId: groupId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Research output not found' };
    }

    await prisma.publication.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PUBLICATION_DELETED',
      entityType: 'Publication',
      entityId: id,
      snapshot: { groupId, id },
    });

    await revalidatePublications(groupId);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete research output' };
  }
}
