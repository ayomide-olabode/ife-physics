ALTER TABLE "ResearchGroup"
RENAME COLUMN "featuredPublicationId" TO "featuredResearchOutputId";

ALTER TABLE "ResearchGroup"
RENAME CONSTRAINT "ResearchGroup_featuredPublicationId_fkey" TO "ResearchGroup_featuredResearchOutputId_fkey";
