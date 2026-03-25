-- AlterEnum
BEGIN;
CREATE TYPE "ResearchOutputType_new" AS ENUM ('BOOK', 'BOOK_CHAPTER', 'CONFERENCE_PAPER', 'DATA', 'JOURNAL_ARTICLE', 'MONOGRAPH', 'OTHER', 'PATENT', 'REPORT', 'SOFTWARE', 'THESIS');
ALTER TABLE "ResearchOutput" ALTER COLUMN "type" TYPE "ResearchOutputType_new" USING ("type"::text::"ResearchOutputType_new");
ALTER TYPE "ResearchOutputType" RENAME TO "ResearchOutputType_old";
ALTER TYPE "ResearchOutputType_new" RENAME TO "ResearchOutputType";
DROP TYPE "ResearchOutputType_old";
COMMIT;

-- CreateTable
CREATE TABLE "PgDegreeContent" (
    "id" TEXT NOT NULL,
    "programmeCode" "ProgrammeCode" NOT NULL,
    "degreeType" "DegreeType" NOT NULL,
    "admissionHtml" TEXT NOT NULL,
    "periodHtml" TEXT NOT NULL,
    "courseHtml" TEXT NOT NULL,
    "examHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PgDegreeContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PgDegreeContent_programmeCode_degreeType_key" ON "PgDegreeContent"("programmeCode" ASC, "degreeType" ASC);
