-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dateOfDeath" TIMESTAMP(3),
ADD COLUMN     "isInMemoriam" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DepartmentalTribute" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentalTribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TributeTestimonial" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "tributeHtml" TEXT NOT NULL,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerUserId" TEXT,
    "declineReason" TEXT,

    CONSTRAINT "TributeTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentalTribute_staffId_key" ON "DepartmentalTribute"("staffId");

-- CreateIndex
CREATE INDEX "TributeTestimonial_staffId_status_submittedAt_idx" ON "TributeTestimonial"("staffId", "status", "submittedAt");

-- AddForeignKey
ALTER TABLE "DepartmentalTribute" ADD CONSTRAINT "DepartmentalTribute_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TributeTestimonial" ADD CONSTRAINT "TributeTestimonial_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
