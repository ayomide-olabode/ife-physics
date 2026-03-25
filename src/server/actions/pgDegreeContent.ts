'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { ProgrammeCode, DegreeType } from '@prisma/client';

const schema = z.object({
  admissionHtml: z
    .string()
    .min(1, 'Admission Requirements are required')
    .max(50000, 'Content too long'),
  periodHtml: z.string().min(1, 'Period of Study is required').max(50000, 'Content too long'),
  courseHtml: z.string().min(1, 'Course Requirements are required').max(50000, 'Content too long'),
  examHtml: z.string().min(1, 'Examination Format is required').max(50000, 'Content too long'),
});

export type UpdatePgDegreeContentInput = z.infer<typeof schema>;

export async function updatePgDegreeContent(
  programmeCode: ProgrammeCode,
  degreeType: DegreeType,
  data: UpdatePgDegreeContentInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const updated = await prisma.pgDegreeContent.upsert({
      where: {
        programmeCode_degreeType: {
          programmeCode,
          degreeType,
        },
      },
      create: {
        programmeCode,
        degreeType,
        ...parsed.data,
      },
      update: {
        ...parsed.data,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'PG_DEGREE_CONTENT_UPDATED',
      entityType: 'PgDegreeContent',
      entityId: updated.id,
      snapshot: updated,
    });

    return { success: true, data: updated };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')
    ) {
      throw error;
    }
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
