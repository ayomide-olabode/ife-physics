'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { ProgrammeCode, DegreeType, RequirementType } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

const reqBlockSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  requirementType: z.nativeEnum(RequirementType),
  orderIndex: z.coerce.number().int().min(0).max(999),
  contentHtml: z.string().min(1, 'Content is required').max(50000),
});

type ReqBlockInput = z.infer<typeof reqBlockSchema>;

function revalidate(programmeCode: ProgrammeCode, level: string) {
  revalidatePath(
    `/dashboard/postgraduate/${programmeCode.toLowerCase()}/${level}/requirement-blocks`,
  );
  // @ts-expect-error Next Canary Type definition bug
  revalidateTag('academics-pg-req');
}

export async function createRequirementBlock(
  programmeCode: ProgrammeCode,
  degreeType: DegreeType,
  data: ReqBlockInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = reqBlockSchema.parse(data);

    const program = await prisma.academicProgram.findUnique({
      where: {
        programmeCode_level: { programmeCode, level: 'POSTGRADUATE' },
      },
      select: { id: true },
    });

    if (!program) {
      return { success: false, error: 'Programme not found' };
    }

    const block = await prisma.requirementBlock.create({
      data: {
        programId: program.id,
        degreeType,
        requirementType: validated.requirementType,
        title: validated.title,
        contentHtml: validated.contentHtml,
        orderIndex: validated.orderIndex,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_REQ_BLOCK_CREATED',
      entityType: 'RequirementBlock',
      entityId: block.id,
      snapshot: { programmeCode, degreeType, ...validated },
    });

    revalidate(programmeCode, degreeType.toLowerCase());

    return { success: true, blockId: block.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create block' };
  }
}

export async function updateRequirementBlock(
  programmeCode: ProgrammeCode,
  degreeType: DegreeType,
  id: string,
  data: ReqBlockInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = reqBlockSchema.parse(data);

    const existing = await prisma.requirementBlock.findFirst({
      where: {
        id,
        degreeType,
        deletedAt: null,
        program: { programmeCode, level: 'POSTGRADUATE' },
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Block not found' };
    }

    await prisma.requirementBlock.update({
      where: { id },
      data: {
        requirementType: validated.requirementType,
        title: validated.title,
        contentHtml: validated.contentHtml,
        orderIndex: validated.orderIndex,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_REQ_BLOCK_UPDATED',
      entityType: 'RequirementBlock',
      entityId: id,
      snapshot: { programmeCode, degreeType, ...validated },
    });

    revalidate(programmeCode, degreeType.toLowerCase());

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update block' };
  }
}

export async function deleteRequirementBlock(
  programmeCode: ProgrammeCode,
  degreeType: DegreeType,
  id: string,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const existing = await prisma.requirementBlock.findFirst({
      where: {
        id,
        degreeType,
        deletedAt: null,
        program: { programmeCode, level: 'POSTGRADUATE' },
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Block not found' };
    }

    await prisma.requirementBlock.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_REQ_BLOCK_DELETED',
      entityType: 'RequirementBlock',
      entityId: id,
      snapshot: { programmeCode, degreeType },
    });

    revalidate(programmeCode, degreeType.toLowerCase());

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete block' };
  }
}

export async function getRequirementBlockAction(
  programmeCode: ProgrammeCode,
  degreeType: DegreeType,
  id: string,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const block = await prisma.requirementBlock.findFirst({
      where: {
        id,
        degreeType,
        deletedAt: null,
        program: {
          programmeCode,
          level: 'POSTGRADUATE',
        },
      },
      select: {
        id: true,
        title: true,
        requirementType: true,
        orderIndex: true,
        contentHtml: true,
      },
    });

    if (!block) {
      return { success: false, error: 'Block not found' };
    }

    return { success: true, block };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch block' };
  }
}
