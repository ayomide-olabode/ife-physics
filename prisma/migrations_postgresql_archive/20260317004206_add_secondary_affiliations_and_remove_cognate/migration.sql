-- Remap existing cognate records before enum value removal.
UPDATE "Staff"
SET "staffType" = 'ACADEMIC'
WHERE "staffType" = 'COGNATE';

-- AlterEnum
BEGIN;
CREATE TYPE "StaffType_new" AS ENUM ('ACADEMIC', 'VISITING', 'EMERITUS', 'TECHNICAL', 'SUPPORT');
ALTER TABLE "Staff" ALTER COLUMN "staffType" TYPE "StaffType_new" USING ("staffType"::text::"StaffType_new");
ALTER TYPE "StaffType" RENAME TO "StaffType_old";
ALTER TYPE "StaffType_new" RENAME TO "StaffType";
DROP TYPE "StaffType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "secondaryAffiliationId" TEXT;

-- CreateTable
CREATE TABLE "SecondaryAffiliation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecondaryAffiliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecondaryAffiliation_name_idx" ON "SecondaryAffiliation"("name");

-- CreateIndex
CREATE INDEX "SecondaryAffiliation_acronym_idx" ON "SecondaryAffiliation"("acronym");

-- CreateIndex
CREATE INDEX "Staff_secondaryAffiliationId_idx" ON "Staff"("secondaryAffiliationId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_secondaryAffiliationId_fkey" FOREIGN KEY ("secondaryAffiliationId") REFERENCES "SecondaryAffiliation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
