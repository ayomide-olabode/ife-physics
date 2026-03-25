'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ProgrammeCode, ProgramLevel, Prisma } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

const studyOptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  about: z.string().max(4000).optional(),
});

type StudyOptionInput = z.infer<typeof studyOptionSchema>;

export async function createGlobalStudyOption(data: StudyOptionInput) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = studyOptionSchema.parse(data);
    const normalize = (val?: string) => (val && val.trim() !== '' ? val : '');

    const studyOption = await prisma.studyOption.create({
      data: {
        name: validated.name,
        about: normalize(validated.about),
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'GLOBAL_STUDY_OPTION_CREATED',
      entityType: 'StudyOption',
      entityId: studyOption.id,
      snapshot: { ...validated },
    });

    return { success: true, studyOptionId: studyOption.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create global study option' };
  }
}

export async function linkStudyOptionToProgram({
  programmeCode,
  level = 'UNDERGRADUATE',
  studyOptionId,
}: {
  programmeCode: ProgrammeCode;
  level?: ProgramLevel;
  studyOptionId: string;
}) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const studyOption = await prisma.studyOption.findFirst({
      where: { id: studyOptionId, deletedAt: null },
      select: { id: true },
    });

    if (!studyOption) {
      return { success: false, error: 'Study option not found' };
    }

    const program = await prisma.academicProgram.findUnique({
      where: { programmeCode_level: { programmeCode, level } },
      select: { id: true },
    });

    if (!program) {
      return { success: false, error: 'Programme not found' };
    }

    const linked = await prisma.programStudyOption.create({
      data: {
        programmeCode,
        level,
        academicProgramId: program.id,
        studyOptionId,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PROGRAM_STUDY_OPTION_LINKED',
      entityType: 'ProgramStudyOption',
      entityId: linked.id,
      snapshot: { programmeCode, level, studyOptionId },
    });

    if (level === 'POSTGRADUATE') {
      revalidatePath(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/overview`);
    } else {
      revalidatePath(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`);
    }

    return { success: true, programStudyOptionId: linked.id };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'This study option is already linked to this programme.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to link study option' };
  }
}

export async function unlinkStudyOptionFromProgram({
  programmeCode,
  level = 'UNDERGRADUATE',
  programStudyOptionId,
}: {
  programmeCode: ProgrammeCode;
  level?: ProgramLevel;
  programStudyOptionId: string;
}) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const existing = await prisma.programStudyOption.findFirst({
      where: { id: programStudyOptionId, programmeCode, level },
      select: { id: true, studyOptionId: true },
    });

    if (!existing) {
      return { success: false, error: 'Linked study option not found' };
    }

    await prisma.programStudyOption.delete({
      where: { id: programStudyOptionId },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PROGRAM_STUDY_OPTION_UNLINKED',
      entityType: 'ProgramStudyOption',
      entityId: programStudyOptionId,
      snapshot: { programmeCode, level, studyOptionId: existing.studyOptionId },
    });

    if (level === 'POSTGRADUATE') {
      revalidatePath(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/overview`);
    } else {
      revalidatePath(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`);
    }

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to unlink study option' };
  }
}
