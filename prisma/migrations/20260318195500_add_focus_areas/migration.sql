ALTER TABLE "ResearchGroupFocusArea" RENAME TO "FocusArea";

ALTER TABLE "FocusArea"
RENAME CONSTRAINT "ResearchGroupFocusArea_pkey" TO "FocusArea_pkey";

ALTER TABLE "FocusArea"
ADD COLUMN "description" TEXT;

ALTER TABLE "FocusArea"
DROP COLUMN "orderIndex";

ALTER TABLE "FocusArea"
RENAME CONSTRAINT "ResearchGroupFocusArea_researchGroupId_fkey" TO "FocusArea_researchGroupId_fkey";

DROP INDEX IF EXISTS "ResearchGroupFocusArea_researchGroupId_orderIndex_idx";
DROP INDEX IF EXISTS "ResearchGroupFocusArea_deletedAt_idx";

CREATE INDEX "FocusArea_researchGroupId_idx" ON "FocusArea"("researchGroupId");
CREATE INDEX "FocusArea_deletedAt_idx" ON "FocusArea"("deletedAt");
