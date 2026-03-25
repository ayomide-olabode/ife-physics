/*
  Warnings:

  - You are about to drop the column `archivedAt` on the `ResourceItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `ResourceItem` table. All the data in the column will be lost.
  - You are about to drop the column `linkUrl` on the `ResourceItem` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `ResourceItem` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ResourceItem` table. All the data in the column will be lost.
  - Added the required column `link` to the `ResourceItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ResourceItem_status_idx";

-- AlterTable
ALTER TABLE "AcademicProgram" ADD COLUMN     "courseDescriptionsIntro" TEXT,
ADD COLUMN     "studyOptionsText" TEXT;

-- AlterTable
ALTER TABLE "ResourceItem" DROP COLUMN "archivedAt",
DROP COLUMN "fileUrl",
DROP COLUMN "linkUrl",
DROP COLUMN "publishedAt",
DROP COLUMN "status",
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "link" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;
