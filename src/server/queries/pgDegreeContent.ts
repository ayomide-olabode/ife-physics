import prisma from '@/lib/prisma';
import { ProgrammeCode, DegreeType } from '@prisma/client';

export async function getPgDegreeContent(programmeCode: ProgrammeCode, degreeType: DegreeType) {
  return prisma.pgDegreeContent.findUnique({
    where: {
      programmeCode_degreeType: {
        programmeCode,
        degreeType,
      },
    },
  });
}
