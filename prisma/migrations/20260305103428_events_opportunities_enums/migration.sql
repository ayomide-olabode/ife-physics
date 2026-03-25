/*
  Warnings:

  - You are about to drop the column `link` on the `EventOpportunity` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `EventOpportunity` table. All the data in the column will be lost.
  - Added the required column `kind` to the `EventOpportunity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventOpportunityKind" AS ENUM ('EVENT', 'OPPORTUNITY');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('SEMINAR', 'LECTURE', 'COLLOQUIUM', 'WORKSHOP', 'TRAINING', 'THESIS_DEFENSE', 'CONFERENCE', 'SYMPOSIUM', 'SCHOOL', 'MEETING', 'SOCIAL', 'OUTREACH', 'COMPETITION');

-- CreateEnum
CREATE TYPE "OpportunityCategory" AS ENUM ('GRANT', 'FUNDING', 'FELLOWSHIP', 'SCHOLARSHIP', 'JOBS', 'INTERNSHIPS', 'EXCHANGE', 'COLLABORATION');

-- DropIndex
DROP INDEX "EventOpportunity_type_deadline_idx";

-- AlterTable
ALTER TABLE "EventOpportunity" DROP COLUMN "link",
DROP COLUMN "type",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "eventCategory" "EventCategory",
ADD COLUMN     "kind" "EventOpportunityKind" NOT NULL,
ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "opportunityCategory" "OpportunityCategory";

-- CreateIndex
CREATE INDEX "EventOpportunity_kind_deadline_idx" ON "EventOpportunity"("kind", "deadline");
