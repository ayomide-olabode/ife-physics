-- AlterTable
ALTER TABLE "ResearchOutput" ADD COLUMN     "abstract" TEXT,
ADD COLUMN     "authorsJson" JSONB,
ADD COLUMN     "fullDate" TIMESTAMP(3),
ADD COLUMN     "groupAuthor" TEXT,
ADD COLUMN     "keywordsJson" JSONB,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "publisher" TEXT,
ADD COLUMN     "sourceTitle" TEXT,
ADD COLUMN     "subtitle" TEXT;
