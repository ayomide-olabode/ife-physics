/*
  Warnings:

  - You are about to drop the column `content` on the `RequirementBlock` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `RequirementBlock` table. All the data in the column will be lost.
  - Added the required column `contentHtml` to the `RequirementBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requirementType` to the `RequirementBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `RequirementBlock` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('ADMISSION', 'COURSE');

-- DropIndex
DROP INDEX "RequirementBlock_programId_section_degreeType_key";

-- AlterTable
ALTER TABLE "RequirementBlock" DROP COLUMN "content",
DROP COLUMN "section",
ADD COLUMN     "contentHtml" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requirementType" "RequirementType" NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "RequirementBlock_programId_degreeType_requirementType_idx" ON "RequirementBlock"("programId", "degreeType", "requirementType");
