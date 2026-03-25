'use server';

import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { ProjectStatus } from '@prisma/client';

const currentYear = new Date().getFullYear();

const projectSchema = z
  .object({
    title: z.string().min(1, 'Title is required.'),
    acronym: z.string().max(30, 'Acronym max 30 characters.').optional().or(z.literal('')),
    descriptionHtml: z
      .string()
      .max(50000, 'Description heavily limited.')
      .optional()
      .or(z.literal('')),
    url: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
    status: z.nativeEnum(ProjectStatus),
    isFunded: z.boolean().default(false),
    startYear: z.coerce.number().int().min(1960).max(currentYear),
    endYear: z.coerce.number().int().nullable().optional(),
  })
  .refine((data) => !data.endYear || data.endYear >= data.startYear, {
    message: 'End year cannot be before start year.',
    path: ['endYear'],
  });

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

export async function createMyProject(
  data: z.infer<typeof projectSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = projectSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    const newDoc = await prisma.project.create({
      data: {
        staffId,
        title: validated.title,
        acronym: validated.acronym || null,
        descriptionHtml: validated.descriptionHtml || null,
        url: validated.url || null,
        status: validated.status,
        isFunded: validated.isFunded,
        startYear: validated.startYear,
        endYear: validated.endYear || null,
      },
      select: { id: true },
    });

    revalidatePath('/dashboard/profile/projects');
    return { success: true, data: newDoc };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to create project:', error);
    return { success: false, error: 'Database mutation failed securely.' };
  }
}

export async function updateMyProject(
  id: string,
  data: z.infer<typeof projectSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = projectSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    // Verify it exists AND belongs to the user
    const existing = await prisma.project.findFirst({
      where: {
        id,
        staffId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Project payload missing or unauthorized matching ownership restrictions.',
      };
    }

    await prisma.project.update({
      where: { id },
      data: {
        title: validated.title,
        acronym: validated.acronym || null,
        descriptionHtml: validated.descriptionHtml || null,
        url: validated.url || null,
        status: validated.status,
        isFunded: validated.isFunded,
        startYear: validated.startYear,
        endYear: validated.endYear || null,
      },
    });

    revalidatePath('/dashboard/profile/projects');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update project:', error);
    return { success: false, error: 'Secure Database limits blocked mutation.' };
  }
}

export async function deleteMyProject(id: string): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'Invalid profile identity tracking bounds.' };
    }

    await requireStaffOwnership(session, staffId);

    const existing = await prisma.project.findFirst({
      where: {
        id,
        staffId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Mapping failure securely ignoring entity deletes.' };
    }

    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath('/dashboard/profile/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete project:', error);
    return {
      success: false,
      error: 'Server blocked secure schema overrides internally resolving states gracefully.',
    };
  }
}
