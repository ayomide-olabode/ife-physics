import 'server-only';

import prisma from '@/lib/prisma';
import { ProgrammeCode, DegreeType } from '@prisma/client';
import { whereNotDeleted } from '../published';

// ── Undergraduate ──

/** Public UG program overview text blocks. */
export async function getPublicUndergraduateProgram(programmeCode: ProgrammeCode) {
  return prisma.academicProgram.findUnique({
    where: { programmeCode_level: { programmeCode, level: 'UNDERGRADUATE' } },
    select: {
      overviewProspects: true,
      admissionRequirements: true,
      courseRequirements: true,
      curriculum: true,
      programmeStructure: true,
      studyOptionsText: true,
      courseDescriptionsIntro: true,
    },
  });
}

/** List UG courses for a programme. */
export async function listPublicUgCourses(programmeCode: ProgrammeCode) {
  const program = await prisma.academicProgram.findUnique({
    where: { programmeCode_level: { programmeCode, level: 'UNDERGRADUATE' } },
    select: { id: true },
  });
  if (!program) return [];

  return prisma.course.findMany({
    where: { programId: program.id, ...whereNotDeleted() },
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
      yearLevel: true,
      semesterTaken: true,
      status: true,
    },
    orderBy: { code: 'asc' },
  });
}

/** UG study options for a programme. */
export async function listPublicUgStudyOptions(programmeCode: ProgrammeCode) {
  const program = await prisma.academicProgram.findUnique({
    where: { programmeCode_level: { programmeCode, level: 'UNDERGRADUATE' } },
    select: { id: true },
  });
  if (!program) return [];

  return prisma.programStudyOption.findMany({
    where: {
      academicProgramId: program.id,
      studyOption: { deletedAt: null },
    },
    select: {
      id: true,
      studyOption: {
        select: {
          id: true,
          name: true,
          about: true,
          slug: true,
          courses: {
            select: {
              course: {
                select: { id: true, code: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ orderIndex: 'asc' }, { studyOption: { name: 'asc' } }],
  });
}

// ── Postgraduate ──

/** Public PG program overview. */
export async function getPublicPostgraduateProgram(programmeCode: ProgrammeCode) {
  return prisma.academicProgram.findUnique({
    where: { programmeCode_level: { programmeCode, level: 'POSTGRADUATE' } },
    select: {
      overviewProspects: true,
      courseDescriptionsIntro: true,
      requirementBlocks: {
        where: whereNotDeleted(),
        select: {
          id: true,
          degreeType: true,
          requirementType: true,
          title: true,
          contentHtml: true,
          orderIndex: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });
}

/** List PG courses for a programme. */
export async function listPublicPgCourses(programmeCode: ProgrammeCode) {
  const program = await prisma.academicProgram.findUnique({
    where: { programmeCode_level: { programmeCode, level: 'POSTGRADUATE' } },
    select: { id: true },
  });
  if (!program) return [];

  return prisma.course.findMany({
    where: { programId: program.id, ...whereNotDeleted() },
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
    },
    orderBy: { code: 'asc' },
  });
}

/** PG degree content block (MSc / MPhil / PhD). */
export async function getPublicPgDegreeContent(
  programmeCode: ProgrammeCode,
  degreeType: DegreeType,
) {
  return prisma.pgDegreeContent.findUnique({
    where: { programmeCode_degreeType: { programmeCode, degreeType } },
    select: {
      admissionHtml: true,
      periodHtml: true,
      courseHtml: true,
      examHtml: true,
    },
  });
}

/** PG study options for a programme. */
export async function listPublicPgStudyOptions(programmeCode: ProgrammeCode) {
  const program = await prisma.academicProgram.findUnique({
    where: { programmeCode_level: { programmeCode, level: 'POSTGRADUATE' } },
    select: { id: true },
  });
  if (!program) return [];

  return prisma.programStudyOption.findMany({
    where: {
      academicProgramId: program.id,
      studyOption: { deletedAt: null },
    },
    select: {
      id: true,
      studyOption: {
        select: {
          id: true,
          name: true,
          about: true,
          slug: true,
          courses: {
            select: {
              course: {
                select: { id: true, code: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ orderIndex: 'asc' }, { studyOption: { name: 'asc' } }],
  });
}
