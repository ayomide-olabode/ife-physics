'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ProgrammeCode, Prisma } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

export async function addCourseToStudyOption(
  programmeCode: ProgrammeCode,
  studyOptionId: string,
  courseId: string,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    // Validate study option belongs to programme
    const studyOption = await prisma.studyOption.findFirst({
      where: {
        id: studyOptionId,
        deletedAt: null,
        programs: { some: { programmeCode, level: 'UNDERGRADUATE' } },
      },
      select: { id: true },
    });

    if (!studyOption) {
      return { success: false, error: 'Study option not found in this programme' };
    }

    // Validate course belongs to programme
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        program: { programmeCode, level: 'UNDERGRADUATE' },
      },
      select: { id: true, code: true },
    });

    if (!course) {
      return { success: false, error: 'Course not found in this programme' };
    }

    await prisma.courseOnStudyOption.create({
      data: {
        courseId,
        studyOptionId,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'STUDY_OPTION_COURSE_ADDED',
      entityType: 'CourseOnStudyOption',
      entityId: `${studyOptionId}:${courseId}`,
      snapshot: { programmeCode, studyOptionId, courseId, courseCode: course.code },
    });

    revalidatePath(
      `/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options/${studyOptionId}`,
    );

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'This course is already mapped to this study option.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add course' };
  }
}

export async function removeCourseFromStudyOption(
  programmeCode: ProgrammeCode,
  studyOptionId: string,
  courseId: string,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    // Validate study option belongs to programme
    const studyOption = await prisma.studyOption.findFirst({
      where: {
        id: studyOptionId,
        deletedAt: null,
        programs: { some: { programmeCode, level: 'UNDERGRADUATE' } },
      },
      select: { id: true },
    });

    if (!studyOption) {
      return { success: false, error: 'Study option not found in this programme' };
    }

    await prisma.courseOnStudyOption.delete({
      where: {
        courseId_studyOptionId: {
          courseId,
          studyOptionId,
        },
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'STUDY_OPTION_COURSE_REMOVED',
      entityType: 'CourseOnStudyOption',
      entityId: `${studyOptionId}:${courseId}`,
      snapshot: { programmeCode, studyOptionId, courseId },
    });

    revalidatePath(
      `/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options/${studyOptionId}`,
    );

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to remove course' };
  }
}
