-- AlterTable
ALTER TABLE "HistoryEntry" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "HistoryEntry_status_idx" ON "HistoryEntry"("status");
