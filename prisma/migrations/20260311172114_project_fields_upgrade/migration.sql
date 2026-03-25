/*
  Warnings:

  - You are about to drop the column `description` on the `Project` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('COMPLETED', 'DISCONTINUED', 'ONGOING');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "description",
ADD COLUMN     "acronym" TEXT,
ADD COLUMN     "descriptionHtml" TEXT,
ADD COLUMN     "endYear" INTEGER,
ADD COLUMN     "isFunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startYear" INTEGER NOT NULL DEFAULT 2025,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ONGOING';
