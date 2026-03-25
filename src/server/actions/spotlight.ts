'use server';

import { requireAuth, requireGlobalRole } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { ScopedRole } from '.prisma/client';

const SPOTLIGHT_PATH = '/dashboard/communication/spotlight';
const PUBLIC_HOME_PATH = '/'; // Assuming Spotlight appears on homepage
const PUBLIC_SPOTLIGHT_PATH = '/spotlight';

const spotlightSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200),
  date: z.string().min(1, 'Display date is required.').or(z.literal('')),
  text: z.string().min(1, 'Text is required.').max(2000),
  imageUrl: z.string().optional().or(z.literal('')),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: { id: string };
};

export async function createSpotlight(
  data: z.infer<typeof spotlightSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = spotlightSchema.parse(data);

    // Date must be present for Spotlight cards
    if (!v.date) {
      return { success: false, fieldErrors: { date: ['Display date is required.'] } };
    }

    const item = await prisma.spotlight.create({
      data: {
        title: v.title,
        date: new Date(v.date),
        text: v.text,
        imageUrl: v.imageUrl || null,
        status: 'DRAFT',
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'SPOTLIGHT_CREATED',
      entityType: 'Spotlight',
      entityId: item.id,
      snapshot: { title: item.title },
    });

    revalidatePath(SPOTLIGHT_PATH);
    return { success: true, data: { id: item.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to create spotlight:', error);
    return { success: false, error: 'Failed to create.' };
  }
}

export async function updateSpotlight(
  id: string,
  data: z.infer<typeof spotlightSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = spotlightSchema.parse(data);

    if (!v.date) {
      return { success: false, fieldErrors: { date: ['Display date is required.'] } };
    }

    await prisma.spotlight.update({
      where: { id },
      data: {
        title: v.title,
        date: new Date(v.date),
        text: v.text,
        imageUrl: v.imageUrl || null,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'SPOTLIGHT_UPDATED',
      entityType: 'Spotlight',
      entityId: id,
      snapshot: { title: v.title },
    });

    revalidatePath(SPOTLIGHT_PATH);
    revalidatePath(`${SPOTLIGHT_PATH}/${id}`);
    // @ts-expect-error Next Canary type bug
    revalidateTag('spotlight');
    revalidatePath(PUBLIC_HOME_PATH);
    revalidatePath(PUBLIC_SPOTLIGHT_PATH);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update spotlight:', error);
    return { success: false, error: 'Failed to update.' };
  }
}

export async function publishSpotlight(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.spotlight.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'SPOTLIGHT_PUBLISHED',
      entityType: 'Spotlight',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(SPOTLIGHT_PATH);
    revalidatePath(`${SPOTLIGHT_PATH}/${id}`);
    // @ts-expect-error Next Canary type bug
    revalidateTag('spotlight');
    revalidatePath(PUBLIC_HOME_PATH);
    revalidatePath(PUBLIC_SPOTLIGHT_PATH);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish spotlight:', error);
    return { success: false, error: 'Failed to publish.' };
  }
}

export async function unpublishSpotlight(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.spotlight.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'SPOTLIGHT_UNPUBLISHED',
      entityType: 'Spotlight',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(SPOTLIGHT_PATH);
    revalidatePath(`${SPOTLIGHT_PATH}/${id}`);
    // @ts-expect-error Next Canary type bug
    revalidateTag('spotlight');
    revalidatePath(PUBLIC_HOME_PATH);
    revalidatePath(PUBLIC_SPOTLIGHT_PATH);
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish spotlight:', error);
    return { success: false, error: 'Failed to unpublish.' };
  }
}

export async function archiveSpotlight(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.spotlight.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'SPOTLIGHT_ARCHIVED',
      entityType: 'Spotlight',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(SPOTLIGHT_PATH);
    revalidatePath(`${SPOTLIGHT_PATH}/${id}`);
    // @ts-expect-error Next Canary type bug
    revalidateTag('spotlight');
    revalidatePath(PUBLIC_HOME_PATH);
    revalidatePath(PUBLIC_SPOTLIGHT_PATH);
    return { success: true };
  } catch (error) {
    console.error('Failed to archive spotlight:', error);
    return { success: false, error: 'Failed to archive.' };
  }
}

export async function deleteSpotlight(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.spotlight.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logAudit({
      actorId: session.user.userId,
      action: 'SPOTLIGHT_DELETED',
      entityType: 'Spotlight',
      entityId: id,
      snapshot: {},
    });
    revalidatePath(SPOTLIGHT_PATH);
    // @ts-expect-error Next Canary type bug
    revalidateTag('spotlight');
    revalidatePath(PUBLIC_HOME_PATH);
    revalidatePath(PUBLIC_SPOTLIGHT_PATH);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete spotlight:', error);
    return { success: false, error: 'Failed to delete.' };
  }
}
