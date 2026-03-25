'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { ProgrammeCode } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

const updatePgSectionsSchema = z.object({
  overviewProspects: z.string().max(50000).optional(),
});

type UpdatePgSectionsInput = z.infer<typeof updatePgSectionsSchema>;

export async function updatePostgraduateProgram(
  programmeCode: ProgrammeCode,
  data: UpdatePgSectionsInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validatedData = updatePgSectionsSchema.parse(data);

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : null);

    const updateData = {
      overviewProspects: normalize(validatedData.overviewProspects),
    };

    const normalizedCode = programmeCode.toUpperCase() as ProgrammeCode;

    const program = await prisma.academicProgram.upsert({
      where: {
        programmeCode_level: {
          programmeCode: normalizedCode,
          level: 'POSTGRADUATE',
        },
      },
      update: updateData,
      create: {
        programmeCode: normalizedCode,
        level: 'POSTGRADUATE',
        slug: `pg-${programmeCode.toLowerCase()}`,
        ...updateData,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_PROGRAM_UPDATED',
      entityType: 'AcademicProgram',
      entityId: programmeCode,
      snapshot: updateData,
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('academics-pg');

    return { success: true, program };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update programme' };
  }
}
