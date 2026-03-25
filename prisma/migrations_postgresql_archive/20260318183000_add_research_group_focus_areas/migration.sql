-- CreateTable
CREATE TABLE "ResearchGroupFocusArea" (
    "id" TEXT NOT NULL,
    "researchGroupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResearchGroupFocusArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchGroupFocusArea_researchGroupId_orderIndex_idx" ON "ResearchGroupFocusArea"("researchGroupId", "orderIndex");

-- CreateIndex
CREATE INDEX "ResearchGroupFocusArea_deletedAt_idx" ON "ResearchGroupFocusArea"("deletedAt");

-- AddForeignKey
ALTER TABLE "ResearchGroupFocusArea"
ADD CONSTRAINT "ResearchGroupFocusArea_researchGroupId_fkey"
FOREIGN KEY ("researchGroupId") REFERENCES "ResearchGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing focus areas blob into a single ordered row
INSERT INTO "ResearchGroupFocusArea" (
  "id",
  "researchGroupId",
  "title",
  "orderIndex",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-focus-' || "id",
  "id",
  "focusAreas",
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ResearchGroup"
WHERE "focusAreas" IS NOT NULL
  AND btrim("focusAreas") <> '';

-- Drop legacy blob field
ALTER TABLE "ResearchGroup" DROP COLUMN "focusAreas";
