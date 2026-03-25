'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ProgrammeCode } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

const studyOptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  about: z.string().max(4000).optional(),
});

type StudyOptionInput = z.infer<typeof studyOptionSchema>;

export async function createStudyOption(programmeCode: ProgrammeCode, data: StudyOptionInput) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = studyOptionSchema.parse(data);

    const program = await prisma.academicProgram.findUnique({
      where: {
        programmeCode_level: {
          programmeCode,
          level: 'UNDERGRADUATE',
        },
      },
      select: { id: true },
    });

    if (!program) {
      return { success: false, error: 'Programme not found' };
    }

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : '');

    const studyOption = await prisma.studyOption.create({
      data: {
        name: validated.name,
        about: normalize(validated.about),
        programs: {
          create: {
            programmeCode,
            level: 'UNDERGRADUATE',
            academicProgramId: program.id,
          },
        },
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'STUDY_OPTION_CREATED',
      entityType: 'StudyOption',
      entityId: studyOption.id,
      snapshot: { programmeCode, ...validated },
    });

    revalidatePath(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`);

    return { success: true, studyOptionId: studyOption.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create study option' };
  }
}

export async function updateStudyOption(
  programmeCode: ProgrammeCode,
  id: string,
  data: StudyOptionInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = studyOptionSchema.parse(data);

    const existing = await prisma.studyOption.findFirst({
      where: {
        id,
        deletedAt: null,
        programs: { some: { programmeCode, level: 'UNDERGRADUATE' } },
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Study option not found' };
    }

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : '');

    await prisma.studyOption.update({
      where: { id },
      data: {
        name: validated.name,
        about: normalize(validated.about),
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'STUDY_OPTION_UPDATED',
      entityType: 'StudyOption',
      entityId: id,
      snapshot: { programmeCode, ...validated },
    });

    revalidatePath(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update study option' };
  }
}

export async function deleteStudyOption(programmeCode: ProgrammeCode, id: string) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const existing = await prisma.studyOption.findFirst({
      where: {
        id,
        deletedAt: null,
        programs: { some: { programmeCode, level: 'UNDERGRADUATE' } },
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Study option not found' };
    }

    await prisma.studyOption.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'STUDY_OPTION_DELETED',
      entityType: 'StudyOption',
      entityId: id,
      snapshot: { programmeCode },
    });

    revalidatePath(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete study option' };
  }
}

export async function fetchStudyOptionDetails(programmeCode: ProgrammeCode, id: string) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const result = await prisma.studyOption.findFirst({
      where: {
        id,
        deletedAt: null,
        programs: {
          some: {
            programmeCode,
            level: 'UNDERGRADUATE',
          },
        },
      },
      select: {
        id: true,
        name: true,
        about: true,
        courses: {
          select: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
          orderBy: {
            course: { code: 'asc' },
          },
        },
      },
    });

    if (!result) return { success: false, error: 'Study option not found' };

    return {
      success: true,
      data: {
        id: result.id,
        name: result.name,
        about: result.about,
        mappedCourses: result.courses.map((c) => c.course),
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch details' };
  }
}
