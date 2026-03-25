/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `ResourceItem` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `ResourceItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ResourceItem" DROP COLUMN "imageUrl",
DROP COLUMN "link",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT';
