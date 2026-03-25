'use server';

import { requireAuth, requireStaffOwnership } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma, ThesisStatus } from '@prisma/client';
import { PROGRAMME_OPTIONS, DEGREE_OPTIONS } from '@/lib/options';

const thesisSchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  title: z.string().min(1, 'Title is required.'),
  studentName: z.string().max(200, 'Student name too long.').optional().or(z.literal('')),
  registrationNumber: z
    .string()
    .max(100, 'Registration number too long.')
    .optional()
    .or(z.literal('')),
  programme: z
    .string()
    .min(1, 'Programme is required.')
    .refine((val) => PROGRAMME_OPTIONS.some((opt) => opt.value === val), {
      message: 'Invalid programme selected.',
    }),
  degreeLevel: z
    .string()
    .min(1, 'Degree level is required')
    .refine((val) => DEGREE_OPTIONS.some((opt) => opt.value === val), {
      message: 'Invalid degree level selected.',
    }),
  externalUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  status: z.nativeEnum(ThesisStatus),
});

type ActionResponse = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

function isMissingRegistrationNumberColumn(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2022') return false;
  const meta = error.meta as { column?: unknown; modelName?: unknown } | undefined;
  const column = String(meta?.column ?? '').toLowerCase();
  const modelName = String(meta?.modelName ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();

  return (
    column.includes('registrationnumber') ||
    message.includes('registrationnumber') ||
    (modelName.includes('studentthesis') && message.includes('does not exist'))
  );
}

export async function createMyThesis(data: z.infer<typeof thesisSchema>): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = thesisSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    let newDoc: { id: string };
    try {
      newDoc = await prisma.studentThesis.create({
        data: {
          staffId,
          year: validated.year,
          title: validated.title,
          studentName: validated.studentName || null,
          registrationNumber: validated.registrationNumber || null,
          programme: validated.programme,
          degreeLevel: validated.degreeLevel,
          externalUrl: validated.externalUrl || null,
          status: validated.status,
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isMissingRegistrationNumberColumn(error)) {
        throw error;
      }

      newDoc = await prisma.studentThesis.create({
        data: {
          staffId,
          year: validated.year,
          title: validated.title,
          studentName: validated.studentName || null,
          programme: validated.programme,
          degreeLevel: validated.degreeLevel,
          externalUrl: validated.externalUrl || null,
          status: validated.status,
        },
        select: { id: true },
      });
    }

    revalidatePath('/dashboard/profile/thesis-supervision');
    return { success: true, data: newDoc };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to create thesis:', error);
    return { success: false, error: 'Database mutation failed securely.' };
  }
}

export async function updateMyThesis(
  id: string,
  data: z.infer<typeof thesisSchema>,
): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const validated = thesisSchema.parse(data);

    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'No associated staff record found.' };
    }

    await requireStaffOwnership(session, staffId);

    const existing = await prisma.studentThesis.findFirst({
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
        error: 'Thesis missing or unauthorized matching ownership restrictions.',
      };
    }

    try {
      await prisma.studentThesis.update({
        where: { id },
        data: {
          year: validated.year,
          title: validated.title,
          studentName: validated.studentName || null,
          registrationNumber: validated.registrationNumber || null,
          programme: validated.programme,
          degreeLevel: validated.degreeLevel,
          externalUrl: validated.externalUrl || null,
          status: validated.status,
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isMissingRegistrationNumberColumn(error)) {
        throw error;
      }

      await prisma.studentThesis.update({
        where: { id },
        data: {
          year: validated.year,
          title: validated.title,
          studentName: validated.studentName || null,
          programme: validated.programme,
          degreeLevel: validated.degreeLevel,
          externalUrl: validated.externalUrl || null,
          status: validated.status,
        },
        select: { id: true },
      });
    }

    revalidatePath('/dashboard/profile/thesis-supervision');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, fieldErrors: error.flatten().fieldErrors };
    }
    console.error('Failed to update thesis:', error);
    return { success: false, error: 'Secure Database limits blocked mutation.' };
  }
}

export async function deleteMyThesis(id: string): Promise<ActionResponse> {
  const session = await requireAuth();

  try {
    const staffId = session.user.staffId;
    if (!staffId) {
      return { success: false, error: 'Invalid profile identity tracking bounds.' };
    }

    // You could also verify if they are super admin, but profile actions usually require being the owner
    await requireStaffOwnership(session, staffId);

    const existing = await prisma.studentThesis.findFirst({
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

    await prisma.studentThesis.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: { id: true },
    });

    revalidatePath('/dashboard/profile/thesis-supervision');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete thesis:', error);
    return {
      success: false,
      error: 'Server blocked secure schema overrides internally resolving states gracefully.',
    };
  }
}
