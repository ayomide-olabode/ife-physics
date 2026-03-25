-- Add nullable semester field for courses (non-destructive).
CREATE TYPE "SemesterTaken" AS ENUM ('HARMATTAN', 'RAIN');

ALTER TABLE "Course"
ADD COLUMN "semesterTaken" "SemesterTaken";

CREATE INDEX "Course_semesterTaken_idx" ON "Course"("semesterTaken");
