-- Add UG year-level support for courses (nullable for PG)
ALTER TABLE "Course"
ADD COLUMN "yearLevel" INTEGER;

CREATE INDEX "Course_yearLevel_idx" ON "Course"("yearLevel");
