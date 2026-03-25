-- Rename lifecycle enum value while preserving existing records.
ALTER TYPE "StaffStatus" RENAME VALUE 'RESIGNED' TO 'FORMER';
