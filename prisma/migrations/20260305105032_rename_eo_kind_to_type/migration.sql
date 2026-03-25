/*
  Warnings:

  - You are about to drop the column `kind` on the `EventOpportunity` table. All the data in the column will be lost.
  - Added the required column `type` to the `EventOpportunity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventOpportunityType" AS ENUM ('EVENT', 'OPPORTUNITY');

-- DropIndex
DROP INDEX "EventOpportunity_kind_deadline_idx";

-- AlterTable
ALTER TABLE "EventOpportunity" DROP COLUMN "kind",
ADD COLUMN     "type" "EventOpportunityType" NOT NULL;

-- DropEnum
DROP TYPE "EventOpportunityKind";

-- CreateIndex
CREATE INDEX "EventOpportunity_type_deadline_idx" ON "EventOpportunity"("type", "deadline");
