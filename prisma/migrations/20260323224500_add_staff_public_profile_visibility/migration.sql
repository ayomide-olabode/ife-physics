ALTER TABLE "Staff"
ADD COLUMN "isPublicProfile" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Staff_isPublicProfile_idx" ON "Staff"("isPublicProfile");
