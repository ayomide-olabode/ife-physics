'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { logAudit } from '@/lib/audit';
import { requireAcademicAccess } from '@/lib/guards';

const baseStudyOptionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().max(4000, 'Description is too long').optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and dashes')
    .max(200)
    .optional(),
});

const studyOptionWithProgramSchema = baseStudyOptionSchema.extend({
  academicProgramId: z.string().min(1, 'Academic programme is required'),
});

async function getProgramWithAccess(academicProgramId: string) {
  const program = await prisma.academicProgram.findUnique({
    where: { id: academicProgramId },
    select: { id: true, programmeCode: true, level: true },
  });

  if (!program) {
    throw new Error('Academic programme not found');
  }

  const session = await requireAcademicAccess({
    level: program.level,
    programmeCode: program.programmeCode,
  });

  return { program, session };
}

function revalidateForProgram(programmeCode: string, level: 'UNDERGRADUATE' | 'POSTGRADUATE') {
  const levelSegment = level === 'UNDERGRADUATE' ? 'undergraduate' : 'postgraduate';
  const code = programmeCode.toLowerCase();

  revalidatePath(`/dashboard/${levelSegment}/${code}/overview`);
  revalidatePath(`/academics/${levelSegment}/${code}`);
}

export async function createStudyOption(data: z.infer<typeof studyOptionWithProgramSchema>) {
  const parsed = studyOptionWithProgramSchema.parse(data);
  const { program, session } = await getProgramWithAccess(parsed.academicProgramId);

  try {
    const studyOption = await prisma.studyOption.create({
      data: {
        name: parsed.title,
        about: parsed.description || '',
        slug: parsed.slug || null,
      },
      select: { id: true },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'STUDY_OPTION_CREATED',
      entityType: 'StudyOption',
      entityId: studyOption.id,
      snapshot: {
        title: parsed.title,
        description: parsed.description || '',
        slug: parsed.slug || null,
      } as Prisma.InputJsonValue,
    });

    revalidateForProgram(program.programmeCode, program.level);

    return { id: studyOption.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Slug already exists.' };
    }
    throw error;
  }
}

export async function updateStudyOption(
  id: string,
  data: z.infer<typeof studyOptionWithProgramSchema>,
) {
  const parsed = studyOptionWithProgramSchema.parse(data);
  const { program, session } = await getProgramWithAccess(parsed.academicProgramId);

  try {
    await prisma.studyOption.update({
      where: { id },
      data: {
        name: parsed.title,
        about: parsed.description || '',
        slug: parsed.slug || null,
      },
    });

    await logAudit({
      actorId: session.user.userId,
      action: 'STUDY_OPTION_UPDATED',
      entityType: 'StudyOption',
      entityId: id,
      snapshot: {
        title: parsed.title,
        description: parsed.description || '',
        slug: parsed.slug || null,
      } as Prisma.InputJsonValue,
    });

    revalidateForProgram(program.programmeCode, program.level);

    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Slug already exists.' };
    }
    throw error;
  }
}

export async function deleteStudyOption({
  id,
  academicProgramId,
}: {
  id: string;
  academicProgramId: string;
}) {
  const { program, session } = await getProgramWithAccess(academicProgramId);

  await prisma.studyOption.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'STUDY_OPTION_DELETED',
    entityType: 'StudyOption',
    entityId: id,
    snapshot: { academicProgramId } as Prisma.InputJsonValue,
  });

  revalidateForProgram(program.programmeCode, program.level);

  return { success: true };
}

export async function toggleProgramStudyOption({
  academicProgramId,
  studyOptionId,
  enabled,
}: {
  academicProgramId: string;
  studyOptionId: string;
  enabled: boolean;
}) {
  const { program, session } = await getProgramWithAccess(academicProgramId);

  const studyOption = await prisma.studyOption.findFirst({
    where: { id: studyOptionId, deletedAt: null },
    select: { id: true },
  });

  if (!studyOption) {
    return { success: false, error: 'Study option not found.' };
  }

  if (enabled) {
    await prisma.programStudyOption.upsert({
      where: {
        academicProgramId_studyOptionId: {
          academicProgramId,
          studyOptionId,
        },
      },
      create: {
        academicProgramId,
        studyOptionId,
        programmeCode: program.programmeCode,
        level: program.level,
      },
      update: {},
    });
  } else {
    await prisma.programStudyOption.deleteMany({
      where: {
        academicProgramId,
        studyOptionId,
      },
    });
  }

  await logAudit({
    actorId: session.user.userId,
    action: 'STUDY_OPTION_TOGGLED',
    entityType: 'ProgramStudyOption',
    entityId: `${academicProgramId}:${studyOptionId}`,
    snapshot: {
      academicProgramId,
      studyOptionId,
      enabled,
      programmeCode: program.programmeCode,
      level: program.level,
    } as Prisma.InputJsonValue,
  });

  revalidateForProgram(program.programmeCode, program.level);

  return { success: true };
}
