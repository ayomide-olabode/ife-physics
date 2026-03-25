'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { ProgrammeCode } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

const updateSectionsSchema = z.object({
  overviewProspects: z.string().max(50000).optional(),
  admissionRequirements: z.string().max(50000).optional(),
  courseRequirements: z.string().max(50000).optional(),
  curriculum: z.string().max(50000).optional(),
  programmeStructure: z.string().max(50000).optional(),
  studyOptionsText: z.string().max(50000).optional(),
  courseDescriptionsIntro: z.string().max(50000).optional(),
});

type UpdateSectionsInput = z.infer<typeof updateSectionsSchema>;

export async function updateUndergraduateProgram(
  programmeCode: ProgrammeCode,
  data: UpdateSectionsInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validatedData = updateSectionsSchema.parse(data);

    // Normalize empty strings to null
    const normalize = (val?: string) => (val && val.trim() !== '' ? val : null);

    const updateData = {
      overviewProspects: normalize(validatedData.overviewProspects),
      admissionRequirements: normalize(validatedData.admissionRequirements),
      courseRequirements: normalize(validatedData.courseRequirements),
      curriculum: normalize(validatedData.curriculum),
      programmeStructure: normalize(validatedData.programmeStructure),
      studyOptionsText: normalize(validatedData.studyOptionsText),
      courseDescriptionsIntro: normalize(validatedData.courseDescriptionsIntro),
    };

    const normalizedCode = programmeCode.toUpperCase() as ProgrammeCode;

    const program = await prisma.academicProgram.upsert({
      where: {
        programmeCode_level: {
          programmeCode: normalizedCode,
          level: 'UNDERGRADUATE',
        },
      },
      update: updateData,
      create: {
        programmeCode: normalizedCode,
        level: 'UNDERGRADUATE',
        slug: `ug-${programmeCode.toLowerCase()}`,
        ...updateData,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'UG_PROGRAM_UPDATED',
      entityType: 'AcademicProgram',
      entityId: programmeCode,
      snapshot: updateData,
    });

    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('academics-ug');

    return { success: true, program };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update program' };
  }
}
