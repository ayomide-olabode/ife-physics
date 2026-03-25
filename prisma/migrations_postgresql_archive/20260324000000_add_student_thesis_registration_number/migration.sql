-- Add optional registration number for dashboard thesis records
ALTER TABLE "StudentThesis"
ADD COLUMN "registrationNumber" TEXT;
