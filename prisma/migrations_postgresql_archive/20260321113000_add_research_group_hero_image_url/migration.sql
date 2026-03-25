-- Add nullable hero image URL to research groups for public hero banners.
ALTER TABLE "ResearchGroup"
ADD COLUMN "heroImageUrl" TEXT;
