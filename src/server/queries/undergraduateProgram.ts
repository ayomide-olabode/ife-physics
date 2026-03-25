import prisma from '@/lib/prisma';
import { ProgrammeCode } from '@prisma/client';

export async function getUndergraduateProgram(programmeCode: ProgrammeCode) {
  const program = await prisma.academicProgram.findUnique({
    where: {
      programmeCode_level: {
        programmeCode,
        level: 'UNDERGRADUATE',
      },
    },
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

  return program;
}
