-- Add split-name fields for Roll of Honour while preserving legacy name column.
ALTER TABLE "RollOfHonourEntry"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "middleName" TEXT,
ADD COLUMN "lastName" TEXT;

-- Backfill existing rows from the legacy name value.
UPDATE "RollOfHonourEntry"
SET
  "firstName" = COALESCE(NULLIF(split_part(trim("name"), ' ', 1), ''), 'Unknown'),
  "middleName" = NULLIF(
    regexp_replace(
      trim("name"),
      '^[^[:space:]]+[[:space:]]+|[[:space:]]+[^[:space:]]+$',
      '',
      'g'
    ),
    ''
  ),
  "lastName" = COALESCE(
    NULLIF(regexp_replace(trim("name"), '^.*[[:space:]]', ''), ''),
    COALESCE(NULLIF(split_part(trim("name"), ' ', 1), ''), 'Unknown')
  )
WHERE "firstName" IS NULL OR "lastName" IS NULL;

ALTER TABLE "RollOfHonourEntry"
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL;
