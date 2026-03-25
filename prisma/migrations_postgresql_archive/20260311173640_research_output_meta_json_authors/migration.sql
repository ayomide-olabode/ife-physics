/*
  Warnings:

  - Added the required column `authors` to the `ResearchOutput` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResearchOutput" ADD COLUMN     "authors" TEXT NOT NULL,
ADD COLUMN     "metaJson" JSONB;
