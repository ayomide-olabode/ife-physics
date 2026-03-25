/*
  Warnings:

  - Made the column `researchGroupId` on table `Publication` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Publication" DROP CONSTRAINT "Publication_researchGroupId_fkey";

-- AlterTable
ALTER TABLE "Publication" ADD COLUMN     "authors" TEXT,
ADD COLUMN     "venue" TEXT,
ALTER COLUMN "year" DROP NOT NULL,
ALTER COLUMN "researchGroupId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_researchGroupId_fkey" FOREIGN KEY ("researchGroupId") REFERENCES "ResearchGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
