/*
  Warnings:

  - Made the column `registrationNumber` on table `RollOfHonourEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cgpa` on table `RollOfHonourEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RollOfHonourEntry" ALTER COLUMN "registrationNumber" SET NOT NULL,
ALTER COLUMN "cgpa" SET NOT NULL;
