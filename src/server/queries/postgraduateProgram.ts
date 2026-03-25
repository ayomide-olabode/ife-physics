import prisma from '@/lib/prisma';
import { ProgrammeCode } from '@prisma/client';

export async function getPostgraduateProgram(programmeCode: ProgrammeCode) {
  return prisma.academicProgram.findUnique({
    where: {
      programmeCode_level: {
        programmeCode,
        level: 'POSTGRADUATE',
      },
    },
    select: {
      overviewProspects: true,
    },
  });
}
