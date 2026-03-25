/*
  Warnings:

  - You are about to drop the column `programId` on the `StudyOption` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `StudyOption` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "StudyOption" DROP CONSTRAINT "StudyOption_programId_fkey";

-- AlterTable
ALTER TABLE "StudyOption" DROP COLUMN "programId",
ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "ProgramStudyOption" (
    "id" TEXT NOT NULL,
    "programmeCode" "ProgrammeCode" NOT NULL,
    "level" "ProgramLevel" NOT NULL,
    "studyOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramStudyOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramStudyOption_programmeCode_level_studyOptionId_key" ON "ProgramStudyOption"("programmeCode", "level", "studyOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyOption_slug_key" ON "StudyOption"("slug");

-- AddForeignKey
ALTER TABLE "ProgramStudyOption" ADD CONSTRAINT "ProgramStudyOption_studyOptionId_fkey" FOREIGN KEY ("studyOptionId") REFERENCES "StudyOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
