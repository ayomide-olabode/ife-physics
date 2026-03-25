-- Add year column for dashboard history entry editing.
ALTER TABLE "HistoryEntry" ADD COLUMN "year" INTEGER;

-- Backfill from existing date values for legacy records.
UPDATE "HistoryEntry"
SET "year" = EXTRACT(YEAR FROM "date")::int
WHERE "year" IS NULL;

ALTER TABLE "HistoryEntry" ALTER COLUMN "year" SET NOT NULL;

CREATE INDEX "HistoryEntry_year_idx" ON "HistoryEntry"("year");
