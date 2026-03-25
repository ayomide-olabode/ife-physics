-- Add optional profile content fields editable by staff and visible on public profiles.
ALTER TABLE "Staff"
ADD COLUMN "education" TEXT,
ADD COLUMN "membershipOfProfessionalOrganizations" TEXT;
