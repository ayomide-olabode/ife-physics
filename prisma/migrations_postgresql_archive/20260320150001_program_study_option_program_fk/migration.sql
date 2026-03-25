-- Add direct program FK mapping for universal study-option selection.
ALTER TABLE "ProgramStudyOption"
ADD COLUMN "academicProgramId" TEXT,
ADD COLUMN "orderIndex" INTEGER NOT NULL DEFAULT 0;

-- Backfill academicProgramId from existing legacy columns.
UPDATE "ProgramStudyOption" pso
SET "academicProgramId" = ap."id"
FROM "AcademicProgram" ap
WHERE ap."programmeCode" = pso."programmeCode"
  AND ap."level" = pso."level";

-- Remove any orphan links that cannot be resolved to a programme row.
DELETE FROM "ProgramStudyOption"
WHERE "academicProgramId" IS NULL;

ALTER TABLE "ProgramStudyOption"
ALTER COLUMN "academicProgramId" SET NOT NULL;

ALTER TABLE "ProgramStudyOption"
ADD CONSTRAINT "ProgramStudyOption_academicProgramId_fkey"
FOREIGN KEY ("academicProgramId") REFERENCES "AcademicProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ProgramStudyOption_academicProgramId_studyOptionId_key"
ON "ProgramStudyOption"("academicProgramId", "studyOptionId");

CREATE INDEX "ProgramStudyOption_academicProgramId_idx"
ON "ProgramStudyOption"("academicProgramId");

CREATE INDEX "ProgramStudyOption_studyOptionId_idx"
ON "ProgramStudyOption"("studyOptionId");
