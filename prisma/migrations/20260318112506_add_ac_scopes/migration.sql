-- CreateEnum
CREATE TYPE "ProgrammeScope" AS ENUM ('GENERAL', 'PHY', 'EPH', 'SLT');

-- CreateEnum
CREATE TYPE "DegreeScope" AS ENUM ('GENERAL', 'UNDERGRADUATE', 'POSTGRADUATE');

-- AlterTable
ALTER TABLE "RoleAssignment" ADD COLUMN     "degreeScope" "DegreeScope",
ADD COLUMN     "programmeScope" "ProgrammeScope";

-- CreateIndex
CREATE INDEX "RoleAssignment_role_programmeScope_degreeScope_idx" ON "RoleAssignment"("role", "programmeScope", "degreeScope");

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_role_deletedAt_idx" ON "RoleAssignment"("userId", "role", "deletedAt");
