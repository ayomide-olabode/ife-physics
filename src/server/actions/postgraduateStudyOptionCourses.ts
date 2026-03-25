'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ProgrammeCode, Prisma } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

export async function addCourseToPostgraduateStudyOption(
  programmeCode: ProgrammeCode,
  studyOptionId: string,
  courseId: string,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const programStudyOption = await prisma.programStudyOption.findFirst({
      where: {
        programmeCode,
        level: 'POSTGRADUATE',
        studyOptionId,
        studyOption: { deletedAt: null },
      },
      select: { id: true },
    });

    if (!programStudyOption) {
      return { success: false, error: 'Study option not found in this programme' };
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        program: { programmeCode, level: 'POSTGRADUATE' },
      },
      select: { id: true, code: true },
    });

    if (!course) {
      return { success: false, error: 'Course not found in this programme' };
    }

    await prisma.courseOnStudyOption.create({
      data: { courseId, studyOptionId },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_STUDY_OPTION_COURSE_ADDED',
      entityType: 'CourseOnStudyOption',
      entityId: `${studyOptionId}:${courseId}`,
      snapshot: { programmeCode, studyOptionId, courseId, courseCode: course.code },
    });

    revalidatePath(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/overview`);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        success: false,
        error: 'This course is already mapped to this study option.',
      };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add course' };
  }
}

export async function removeCourseFromPostgraduateStudyOption(
  programmeCode: ProgrammeCode,
  studyOptionId: string,
  courseId: string,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const programStudyOption = await prisma.programStudyOption.findFirst({
      where: {
        programmeCode,
        level: 'POSTGRADUATE',
        studyOptionId,
        studyOption: { deletedAt: null },
      },
      select: { id: true },
    });

    if (!programStudyOption) {
      return { success: false, error: 'Study option not found in this programme' };
    }

    await prisma.courseOnStudyOption.delete({
      where: {
        courseId_studyOptionId: { courseId, studyOptionId },
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_STUDY_OPTION_COURSE_REMOVED',
      entityType: 'CourseOnStudyOption',
      entityId: `${studyOptionId}:${courseId}`,
      snapshot: { programmeCode, studyOptionId, courseId },
    });

    revalidatePath(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/overview`);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to remove course' };
  }
}
