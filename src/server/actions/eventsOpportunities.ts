'use server';

import { requireAuth, requireGlobalRole } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  ScopedRole,
  EventOpportunityType,
  EventCategory,
  OpportunityCategory,
} from '.prisma/client';

const EO_PATH = '/dashboard/communication/events-opportunities';

const baseSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200),
  type: z.nativeEnum(EventOpportunityType),
  eventCategory: z.nativeEnum(EventCategory).nullable().optional(),
  opportunityCategory: z.nativeEnum(OpportunityCategory).nullable().optional(),
  description: z.string().max(4000).optional().or(z.literal('')),
  duration: z.string().max(120).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  venue: z.string().max(200).optional().or(z.literal('')),
  linkUrl: z.string().url().optional().or(z.literal('')),
  deadline: z.string().optional().or(z.literal('')),
});

const eoSchema = baseSchema.superRefine((data, ctx) => {
  if (data.type === 'EVENT') {
    if (!data.eventCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Category is required for Events.',
        path: ['eventCategory'],
      });
    }
  }
  if (data.type === 'OPPORTUNITY') {
    if (!data.opportunityCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Category is required for Opportunities.',
        path: ['opportunityCategory'],
      });
    }
  }
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: { id: string };
};

function isMissingDurationColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as {
    code?: unknown;
    message?: unknown;
    meta?: { column?: unknown; modelName?: unknown };
  };

  if (err.code !== 'P2022') return false;

  const column = String(err.meta?.column ?? '').toLowerCase();
  const modelName = String(err.meta?.modelName ?? '').toLowerCase();
  const message = String(err.message ?? '').toLowerCase();

  return (
    column.includes('duration') ||
    message.includes('duration') ||
    (modelName.includes('eventopportunity') && message.includes('does not exist'))
  );
}

function hasDurationValue(duration: string | null | undefined): boolean {
  return !!duration?.trim();
}

export async function createEventOpportunity(
  data: z.infer<typeof baseSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = eoSchema.parse(data);

    const dataWithDuration = {
      title: v.title,
      type: v.type,
      eventCategory: v.type === 'EVENT' ? (v.eventCategory ?? null) : null,
      opportunityCategory: v.type === 'OPPORTUNITY' ? (v.opportunityCategory ?? null) : null,
      description: v.description || null,
      duration: v.duration || null,
      startDate: v.startDate ? new Date(v.startDate) : null,
      endDate: v.endDate ? new Date(v.endDate) : null,
      venue: v.venue || null,
      linkUrl: v.linkUrl || null,
      deadline: v.deadline ? new Date(v.deadline) : null,
      status: 'DRAFT' as const,
    };
    const dataWithoutDuration = {
      title: v.title,
      type: v.type,
      eventCategory: v.type === 'EVENT' ? (v.eventCategory ?? null) : null,
      opportunityCategory: v.type === 'OPPORTUNITY' ? (v.opportunityCategory ?? null) : null,
      description: v.description || null,
      startDate: v.startDate ? new Date(v.startDate) : null,
      endDate: v.endDate ? new Date(v.endDate) : null,
      venue: v.venue || null,
      linkUrl: v.linkUrl || null,
      deadline: v.deadline ? new Date(v.deadline) : null,
      status: 'DRAFT' as const,
    };

    let item: { id: string };
    try {
      item = await prisma.eventOpportunity.create({
        data: dataWithDuration,
        select: { id: true },
      });
    } catch (error) {
      if (!isMissingDurationColumn(error)) {
        throw error;
      }

      if (hasDurationValue(v.duration)) {
        return {
          success: false,
          error:
            'Duration could not be saved because the database is missing the EventOpportunity.duration column. Run Prisma migrations, then try again.',
        };
      }

      item = await prisma.eventOpportunity.create({
        data: dataWithoutDuration,
        select: { id: true },
      });
    }

    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_CREATED',
      entityType: 'EventOpportunity',
      entityId: item.id,
      snapshot: { title: v.title, type: v.type },
    });

    revalidatePath(EO_PATH);
    return { success: true, data: { id: item.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to create event/opportunity:', error);
    return { success: false, error: 'Failed to create.' };
  }
}

export async function updateEventOpportunity(
  id: string,
  data: z.infer<typeof baseSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = eoSchema.parse(data);

    const dataWithDuration = {
      title: v.title,
      type: v.type,
      eventCategory: v.type === 'EVENT' ? (v.eventCategory ?? null) : null,
      opportunityCategory: v.type === 'OPPORTUNITY' ? (v.opportunityCategory ?? null) : null,
      description: v.description || null,
      duration: v.duration || null,
      startDate: v.startDate ? new Date(v.startDate) : null,
      endDate: v.endDate ? new Date(v.endDate) : null,
      venue: v.venue || null,
      linkUrl: v.linkUrl || null,
      deadline: v.deadline ? new Date(v.deadline) : null,
    };
    const dataWithoutDuration = {
      title: v.title,
      type: v.type,
      eventCategory: v.type === 'EVENT' ? (v.eventCategory ?? null) : null,
      opportunityCategory: v.type === 'OPPORTUNITY' ? (v.opportunityCategory ?? null) : null,
      description: v.description || null,
      startDate: v.startDate ? new Date(v.startDate) : null,
      endDate: v.endDate ? new Date(v.endDate) : null,
      venue: v.venue || null,
      linkUrl: v.linkUrl || null,
      deadline: v.deadline ? new Date(v.deadline) : null,
    };

    try {
      await prisma.eventOpportunity.update({
        where: { id },
        data: dataWithDuration,
        select: { id: true },
      });
    } catch (error) {
      if (!isMissingDurationColumn(error)) {
        throw error;
      }

      if (hasDurationValue(v.duration)) {
        return {
          success: false,
          error:
            'Duration could not be saved because the database is missing the EventOpportunity.duration column. Run Prisma migrations, then try again.',
        };
      }

      await prisma.eventOpportunity.update({
        where: { id },
        data: dataWithoutDuration,
        select: { id: true },
      });
    }

    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_UPDATED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: { title: v.title, type: v.type },
    });

    revalidatePath(EO_PATH);
    revalidatePath(`${EO_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update event/opportunity:', error);
    return { success: false, error: 'Failed to update.' };
  }
}

export async function deleteEventOpportunity(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.eventOpportunity.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_DELETED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(EO_PATH);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete:', error);
    return { success: false, error: 'Failed to delete.' };
  }
}

export async function publishEventOpportunity(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.eventOpportunity.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      select: { id: true },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_PUBLISHED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(EO_PATH);
    revalidatePath(`${EO_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish:', error);
    return { success: false, error: 'Failed to publish.' };
  }
}

export async function unpublishEventOpportunity(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.eventOpportunity.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
      select: { id: true },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_UNPUBLISHED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(EO_PATH);
    revalidatePath(`${EO_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish:', error);
    return { success: false, error: 'Failed to unpublish.' };
  }
}

export async function archiveEventOpportunity(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.eventOpportunity.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
      select: { id: true },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'EVENT_OPPORTUNITY_ARCHIVED',
      entityType: 'EventOpportunity',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(EO_PATH);
    revalidatePath(`${EO_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to archive:', error);
    return { success: false, error: 'Failed to archive.' };
  }
}
