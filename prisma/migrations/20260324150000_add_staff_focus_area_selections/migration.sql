CREATE TABLE "StaffFocusAreaSelection" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "focusAreaId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StaffFocusAreaSelection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffFocusAreaSelection_staffId_focusAreaId_key"
ON "StaffFocusAreaSelection"("staffId", "focusAreaId");

CREATE INDEX "StaffFocusAreaSelection_staffId_idx"
ON "StaffFocusAreaSelection"("staffId");

CREATE INDEX "StaffFocusAreaSelection_focusAreaId_idx"
ON "StaffFocusAreaSelection"("focusAreaId");

ALTER TABLE "StaffFocusAreaSelection"
ADD CONSTRAINT "StaffFocusAreaSelection_staffId_fkey"
FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffFocusAreaSelection"
ADD CONSTRAINT "StaffFocusAreaSelection_focusAreaId_fkey"
FOREIGN KEY ("focusAreaId") REFERENCES "FocusArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
