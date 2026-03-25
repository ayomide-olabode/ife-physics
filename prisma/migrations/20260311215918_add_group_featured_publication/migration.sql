-- AlterTable
ALTER TABLE "ResearchGroup" ADD COLUMN     "featuredPublicationId" TEXT;

-- AddForeignKey
ALTER TABLE "ResearchGroup" ADD CONSTRAINT "ResearchGroup_featuredPublicationId_fkey" FOREIGN KEY ("featuredPublicationId") REFERENCES "ResearchOutput"("id") ON DELETE SET NULL ON UPDATE CASCADE;
