'use server';

import { requireAuth, requireGlobalRole } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ScopedRole } from '.prisma/client';

const NEWS_PATH = '/dashboard/communication/news';

const newsSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200),
  slug: z.string().min(1, 'Slug is required.').max(200),
  body: z.string().min(1, 'Body content is required.'),
  imageUrl: z
    .string()
    .refine((val) => val === '' || val.startsWith('/') || /^https?:\/\//.test(val), {
      message: 'Must be a valid URL or path.',
    })
    .optional()
    .or(z.literal('')),
  date: z.string().min(1, 'Date is required.'),
  buttonLabel: z.string().max(100).optional().or(z.literal('')),
  buttonLink: z.string().url().optional().or(z.literal('')),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: { id: string };
};

export async function createNews(data: z.infer<typeof newsSchema>): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = newsSchema.parse(data);

    const existingSlug = await prisma.news.findUnique({
      where: { slug: v.slug },
      select: { id: true },
    });
    if (existingSlug) {
      return { success: false, error: 'A news article with this slug already exists.' };
    }

    const article = await prisma.news.create({
      data: {
        title: v.title,
        slug: v.slug,
        body: v.body,
        imageUrl: v.imageUrl || null,
        date: new Date(v.date),
        buttonLabel: v.buttonLabel || null,
        buttonLink: v.buttonLink || null,
        status: 'DRAFT',
      },
      select: { id: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'NEWS_CREATED',
      entityType: 'News',
      entityId: article.id,
      snapshot: { title: v.title, slug: v.slug },
    });

    revalidatePath(NEWS_PATH);
    return { success: true, data: { id: article.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to create news:', error);
    return { success: false, error: 'Failed to create news article.' };
  }
}

export async function updateNews(
  id: string,
  data: z.infer<typeof newsSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const v = newsSchema.parse(data);

    const existingSlug = await prisma.news.findFirst({
      where: { slug: v.slug, id: { not: id }, deletedAt: null },
      select: { id: true },
    });
    if (existingSlug) {
      return { success: false, error: 'A different article already uses this slug.' };
    }

    await prisma.news.update({
      where: { id },
      data: {
        title: v.title,
        slug: v.slug,
        body: v.body,
        imageUrl: v.imageUrl || null,
        date: new Date(v.date),
        buttonLabel: v.buttonLabel || null,
        buttonLink: v.buttonLink || null,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'NEWS_UPDATED',
      entityType: 'News',
      entityId: id,
      snapshot: { title: v.title, slug: v.slug },
    });

    revalidatePath(NEWS_PATH);
    revalidatePath(`${NEWS_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update news:', error);
    return { success: false, error: 'Failed to update news article.' };
  }
}

export async function deleteNews(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.news.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'NEWS_DELETED',
      entityType: 'News',
      entityId: id,
      snapshot: {},
    });

    revalidatePath(NEWS_PATH);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete news:', error);
    return { success: false, error: 'Failed to delete news article.' };
  }
}

export async function publishNews(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.news.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'NEWS_PUBLISHED',
      entityType: 'News',
      entityId: id,
      snapshot: {},
    });

    revalidatePath(NEWS_PATH);
    revalidatePath(`${NEWS_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish news:', error);
    return { success: false, error: 'Failed to publish.' };
  }
}

export async function unpublishNews(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.news.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'NEWS_UNPUBLISHED',
      entityType: 'News',
      entityId: id,
      snapshot: {},
    });

    revalidatePath(NEWS_PATH);
    revalidatePath(`${NEWS_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish news:', error);
    return { success: false, error: 'Failed to unpublish.' };
  }
}

export async function archiveNews(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    await prisma.news.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'NEWS_ARCHIVED',
      entityType: 'News',
      entityId: id,
      snapshot: {},
    });

    revalidatePath(NEWS_PATH);
    revalidatePath(`${NEWS_PATH}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to archive news:', error);
    return { success: false, error: 'Failed to archive.' };
  }
}

export async function toggleFeaturedNews(id: string): Promise<ActionResponse> {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const article = await prisma.news.findUnique({
      where: { id },
      select: { isFeatured: true },
    });
    if (!article) {
      return { success: false, error: 'Article not found.' };
    }

    await prisma.news.update({
      where: { id },
      data: { isFeatured: !article.isFeatured },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'NEWS_FEATURED_TOGGLED',
      entityType: 'News',
      entityId: id,
      snapshot: { isFeatured: !article.isFeatured },
    });

    revalidatePath(NEWS_PATH);
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle featured:', error);
    return { success: false, error: 'Failed to toggle featured status.' };
  }
}
