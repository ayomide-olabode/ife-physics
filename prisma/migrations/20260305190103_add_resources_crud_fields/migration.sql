/*
  Warnings:

  - Made the column `description` on table `ResourceItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ResourceItem" ALTER COLUMN "description" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ResourceItem_status_idx" ON "ResourceItem"("status");
