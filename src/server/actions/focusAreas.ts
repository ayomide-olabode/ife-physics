'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/guards';
import { isResearchLeadForGroup, isSuperAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

const focusAreaSchema = z.object({
  groupId: z.string().min(1, 'Group is required'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(300, 'Title must be at most 300 characters'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .nullable(),
});

const focusAreaUpdateSchema = focusAreaSchema.extend({
  id: z.string().min(1, 'Focus area id is required'),
});

const focusAreaDeleteSchema = z.object({
  id: z.string().min(1, 'Focus area id is required'),
  groupId: z.string().min(1, 'Group is required'),
});

function normalizeOptionalText(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensureFocusAreaAccess(groupId: string) {
  const session = await requireAuth();
  if (!isSuperAdmin(session) && !(await isResearchLeadForGroup(session, groupId))) {
    return { session, allowed: false as const };
  }
  return { session, allowed: true as const };
}

function mapFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}

export async function createFocusArea(input: {
  groupId: string;
  title: string;
  description?: string | null;
}) {
  try {
    const parsed = focusAreaSchema.parse(input);
    const { session, allowed } = await ensureFocusAreaAccess(parsed.groupId);
    if (!allowed) {
      return { success: false, error: 'Unauthorized' };
    }

    const group = await prisma.researchGroup.findFirst({
      where: { id: parsed.groupId, deletedAt: null },
      select: { id: true },
    });
    if (!group) {
      return { success: false, error: 'Research group not found' };
    }

    const focusArea = await prisma.focusArea.create({
      data: {
        researchGroupId: parsed.groupId,
        title: parsed.title,
        description: normalizeOptionalText(parsed.description),
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_CREATED',
      entityType: 'FocusArea',
      entityId: focusArea.id,
      snapshot: {
        groupId: parsed.groupId,
        title: focusArea.title,
        description: focusArea.description,
      },
    });

    revalidatePath(`/dashboard/research/groups/${parsed.groupId}`);
    return { success: true, focusArea };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? 'Validation failed',
        fieldErrors: mapFieldErrors(error),
      };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create focus area' };
  }
}

export async function updateFocusArea(input: {
  id: string;
  groupId: string;
  title: string;
  description?: string | null;
}) {
  try {
    const parsed = focusAreaUpdateSchema.parse(input);
    const { session, allowed } = await ensureFocusAreaAccess(parsed.groupId);
    if (!allowed) {
      return { success: false, error: 'Unauthorized' };
    }

    const existing = await prisma.focusArea.findFirst({
      where: {
        id: parsed.id,
        researchGroupId: parsed.groupId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });
    if (!existing) {
      return { success: false, error: 'Focus area not found' };
    }

    const focusArea = await prisma.focusArea.update({
      where: { id: parsed.id },
      data: {
        title: parsed.title,
        description: normalizeOptionalText(parsed.description),
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_UPDATED',
      entityType: 'FocusArea',
      entityId: focusArea.id,
      snapshot: {
        groupId: parsed.groupId,
        previousTitle: existing.title,
        previousDescription: existing.description,
        title: focusArea.title,
        description: focusArea.description,
      },
    });

    revalidatePath(`/dashboard/research/groups/${parsed.groupId}`);
    return { success: true, focusArea };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? 'Validation failed',
        fieldErrors: mapFieldErrors(error),
      };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update focus area' };
  }
}

export async function deleteFocusArea(input: { id: string; groupId: string }) {
  try {
    const parsed = focusAreaDeleteSchema.parse(input);
    const { session, allowed } = await ensureFocusAreaAccess(parsed.groupId);
    if (!allowed) {
      return { success: false, error: 'Unauthorized' };
    }

    const existing = await prisma.focusArea.findFirst({
      where: {
        id: parsed.id,
        researchGroupId: parsed.groupId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });
    if (!existing) {
      return { success: false, error: 'Focus area not found' };
    }

    await prisma.focusArea.update({
      where: { id: parsed.id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'FOCUS_AREA_DELETED',
      entityType: 'FocusArea',
      entityId: parsed.id,
      snapshot: {
        groupId: parsed.groupId,
        title: existing.title,
        description: existing.description,
      },
    });

    revalidatePath(`/dashboard/research/groups/${parsed.groupId}`);
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? 'Validation failed',
        fieldErrors: mapFieldErrors(error),
      };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete focus area' };
  }
}
