'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { requireAuth, requireSuperAdmin, requireResearchLeadForGroup } from '@/lib/guards';
import { isSuperAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

const heroImageUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? null : v))
  .refine(
    (v) =>
      v === undefined ||
      v === null ||
      v.startsWith('/') ||
      v.startsWith('https://') ||
      v.startsWith('http://'),
    { message: 'Hero image URL must be a valid URL or a site path starting with /' },
  );

const researchGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  abbreviation: z
    .string()
    .min(2, 'Abbreviation must be at least 2 characters')
    .max(10, 'Abbreviation must be at most 10 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  heroImageUrl: heroImageUrlSchema,
  overview: z.string().max(50000).optional(),
});

type ResearchGroupInput = z.infer<typeof researchGroupSchema>;
const focusAreaTitleSchema = z
  .string()
  .trim()
  .min(1, 'Focus area title is required')
  .max(300, 'Focus area title must be at most 300 characters');

async function requireResearchGroupScopeAccess(
  session: Awaited<ReturnType<typeof requireAuth>>,
  groupId: string,
) {
  if (!isSuperAdmin(session)) {
    await requireResearchLeadForGroup(session, groupId);
  }
}

export async function createResearchGroup(data: ResearchGroupInput) {
  try {
    const session = await requireAuth();
    await requireSuperAdmin(session);

    const validated = researchGroupSchema.parse(data);

    const normalize = (val?: string | null) => (val && val.trim() !== '' ? val : null);

    const group = await prisma.researchGroup.create({
      data: {
        name: validated.name,
        abbreviation: validated.abbreviation,
        slug: validated.slug,
        heroImageUrl: normalize(validated.heroImageUrl),
        overview: normalize(validated.overview),
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'RESEARCH_GROUP_CREATED',
      entityType: 'ResearchGroup',
      entityId: group.id,
      snapshot: validated,
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('public:research-groups');
    revalidatePath('/research');
    revalidatePath(`/research/${validated.slug}`);

    return { success: true, groupId: group.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A group with this slug already exists.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create research group' };
  }
}

export async function updateResearchGroup(groupId: string, data: ResearchGroupInput) {
  try {
    const session = await requireAuth();

    await requireResearchGroupScopeAccess(session, groupId);

    const validated = researchGroupSchema.parse(data);

    const existing = await prisma.researchGroup.findFirst({
      where: { id: groupId, deletedAt: null },
      select: { id: true, slug: true },
    });

    if (!existing) {
      return { success: false, error: 'Research group not found' };
    }

    const normalize = (val?: string | null) => (val && val.trim() !== '' ? val : null);

    await prisma.researchGroup.update({
      where: { id: groupId },
      data: {
        name: validated.name,
        abbreviation: validated.abbreviation,
        slug: validated.slug,
        heroImageUrl: normalize(validated.heroImageUrl),
        overview: normalize(validated.overview),
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'RESEARCH_GROUP_UPDATED',
      entityType: 'ResearchGroup',
      entityId: groupId,
      snapshot: validated,
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('public:research-groups');
    revalidatePath('/research');
    revalidatePath(`/research/${existing.slug}`);
    revalidatePath(`/research/${validated.slug}`);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A group with this slug already exists.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update research group' };
  }
}

export async function addFocusArea(researchGroupId: string, title: string) {
  try {
    const session = await requireAuth();
    await requireResearchGroupScopeAccess(session, researchGroupId);

    const parsedTitle = focusAreaTitleSchema.parse(title);

    const existing = await prisma.researchGroup.findFirst({
      where: { id: researchGroupId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: 'Research group not found' };
    }

    const focusArea = await prisma.focusArea.create({
      data: {
        researchGroupId,
        title: parsedTitle,
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_ADDED',
      entityType: 'FocusArea',
      entityId: focusArea.id,
      snapshot: {
        researchGroupId,
        title: focusArea.title,
        description: focusArea.description,
      },
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    return { success: true, focusArea };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add focus area' };
  }
}

export async function updateFocusArea(id: string, title: string) {
  try {
    const session = await requireAuth();
    const parsedTitle = focusAreaTitleSchema.parse(title);

    const existing = await prisma.focusArea.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, researchGroupId: true, title: true },
    });
    if (!existing) {
      return { success: false, error: 'Focus area not found' };
    }

    await requireResearchGroupScopeAccess(session, existing.researchGroupId);

    const updated = await prisma.focusArea.update({
      where: { id },
      data: { title: parsedTitle },
      select: { id: true, title: true, description: true },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_UPDATED',
      entityType: 'FocusArea',
      entityId: id,
      snapshot: {
        researchGroupId: existing.researchGroupId,
        previousTitle: existing.title,
        title: updated.title,
        description: updated.description,
      },
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    return { success: true, focusArea: updated };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update focus area' };
  }
}

export async function removeFocusArea(id: string) {
  try {
    const session = await requireAuth();

    const existing = await prisma.focusArea.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, researchGroupId: true, title: true, description: true },
    });
    if (!existing) {
      return { success: false, error: 'Focus area not found' };
    }

    await requireResearchGroupScopeAccess(session, existing.researchGroupId);

    await prisma.focusArea.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_REMOVED',
      entityType: 'FocusArea',
      entityId: id,
      snapshot: {
        researchGroupId: existing.researchGroupId,
        title: existing.title,
        description: existing.description,
      },
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('research-groups');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to remove focus area' };
  }
}
