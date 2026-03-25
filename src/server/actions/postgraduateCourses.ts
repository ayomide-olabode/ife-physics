'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { ProgrammeCode, Prisma } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { normalizeCourseCode } from '@/lib/courseCode';

const courseCodeRegex = /^[A-Z]{2,6}[0-9]{2,4}$/;

const courseSchema = z.object({
  code: z
    .string()
    .min(1, 'Course code is required')
    .transform((v) => normalizeCourseCode(v))
    .refine(
      (value) => courseCodeRegex.test(value),
      'Code must match format like PHY101 (2-6 letters + 2-4 digits)',
    ),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(4000).optional(),
  prerequisites: z.string().max(500).optional(),
  L: z.coerce.number().int().min(0).max(10),
  T: z.coerce.number().int().min(0).max(10),
  P: z.coerce.number().int().min(0).max(10),
  U: z.coerce.number().int().min(0).max(10),
  semesterTaken: z.enum(['HARMATTAN', 'RAIN']),
  status: z.enum(['CORE', 'RESTRICTED']),
});

type CourseInput = z.infer<typeof courseSchema>;

export async function createPostgraduateCourseForProgramme(
  programmeCode: ProgrammeCode,
  data: CourseInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = courseSchema.parse(data);

    const program = await prisma.academicProgram.findUnique({
      where: {
        programmeCode_level: {
          programmeCode,
          level: 'POSTGRADUATE',
        },
      },
      select: { id: true },
    });

    if (!program) {
      return { success: false, error: 'Programme not found' };
    }

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : null);

    const dataPayload = {
      title: validated.title,
      description: normalize(validated.description),
      prerequisites: normalize(validated.prerequisites),
      L: validated.L,
      T: validated.T,
      P: validated.P,
      U: validated.U,
      semesterTaken: validated.semesterTaken,
      yearLevel: null,
      status: validated.status,
      programId: program.id,
    };

    const course = await prisma.course.upsert({
      where: { code: validated.code },
      create: {
        code: validated.code,
        ...dataPayload,
      },
      update: {
        ...dataPayload,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_COURSE_UPSERTED',
      entityType: 'Course',
      entityId: course.id,
      snapshot: { programmeCode, ...validated },
    });

    revalidatePath(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/courses`);
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('courses-pg');

    return { success: true, courseId: course.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create or update course' };
  }
}

export async function updatePostgraduateCourseForProgramme(
  programmeCode: ProgrammeCode,
  id: string,
  data: CourseInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = courseSchema.parse(data);

    const existing = await prisma.course.findFirst({
      where: {
        id,
        program: { programmeCode, level: 'POSTGRADUATE' },
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Course not found in this programme' };
    }

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : null);

    const course = await prisma.course.update({
      where: { id },
      data: {
        code: validated.code,
        title: validated.title,
        description: normalize(validated.description),
        prerequisites: normalize(validated.prerequisites),
        L: validated.L,
        T: validated.T,
        P: validated.P,
        U: validated.U,
        semesterTaken: validated.semesterTaken,
        yearLevel: null,
        status: validated.status,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_COURSE_UPDATED',
      entityType: 'Course',
      entityId: course.id,
      snapshot: { programmeCode, ...validated },
    });

    revalidatePath(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/courses`);
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('courses-pg');

    return { success: true, courseId: course.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        success: false,
        error: 'A course with this code already exists.',
      };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update course' };
  }
}

export async function lookupCourseByCode({
  programmeCode,
  codePrefix,
}: {
  programmeCode: ProgrammeCode;
  codePrefix: string;
}) {
  return prisma.course.findMany({
    where: {
      code: { startsWith: codePrefix},
      program: {
        programmeCode,
        level: 'POSTGRADUATE',
      },
    },
    select: {
      id: true,
      code: true,
      title: true,
    },
    orderBy: { code: 'asc' },
    take: 10,
  });
}

export async function getCourseByExactCode({ code }: { code: string }) {
  return prisma.course.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      prerequisites: true,
      L: true,
      T: true,
      P: true,
      U: true,
      semesterTaken: true,
      status: true,
      programId: true,
    },
  });
}
