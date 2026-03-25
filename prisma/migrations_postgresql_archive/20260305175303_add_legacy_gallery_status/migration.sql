-- AlterTable
ALTER TABLE "LegacyGalleryItem" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT';
