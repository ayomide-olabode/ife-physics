-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('ACADEMIC', 'COGNATE', 'VISITING', 'EMERITUS', 'TECHNICAL', 'SUPPORT');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'RETIRED', 'IN_MEMORIAM');

-- CreateEnum
CREATE TYPE "ProgramLevel" AS ENUM ('UNDERGRADUATE', 'POSTGRADUATE');

-- CreateEnum
CREATE TYPE "ProgrammeCode" AS ENUM ('PHY', 'EPH', 'SLT');

-- CreateEnum
CREATE TYPE "DegreeType" AS ENUM ('BSC', 'MSC', 'MPHIL', 'PHD');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('CORE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ScopedRole" AS ENUM ('ACADEMIC_COORDINATOR', 'RESEARCH_LEAD', 'EDITOR');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('GLOBAL', 'RESEARCH_GROUP');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadershipRole" AS ENUM ('HOD', 'ACADEMIC_COORDINATOR');

-- CreateEnum
CREATE TYPE "ResearchOutputType" AS ENUM ('TECHNICAL_REPORT', 'JOURNAL_ARTICLE', 'BOOK', 'MONOGRAPH', 'CONFERENCE_PROCEEDINGS', 'OTHER');

-- CreateEnum
CREATE TYPE "ThesisStatus" AS ENUM ('ONGOING', 'COMPLETED', 'DISCONTINUED');

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "institutionalEmail" TEXT NOT NULL,
    "staffType" "StaffType" NOT NULL,
    "staffStatus" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "visitStartDate" TIMESTAMP(3),
    "visitEndDate" TIMESTAMP(3),
    "academicRank" TEXT,
    "designation" TEXT,
    "researchArea" TEXT,
    "roomNumber" TEXT,
    "academicLinkUrl" TEXT,
    "operationalUnit" TEXT,
    "areaOfExpertise" TEXT,
    "phoneNumber" TEXT,
    "bio" TEXT,
    "researchInterests" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ScopedRole" NOT NULL,
    "scopeType" "ScopeType" NOT NULL,
    "scopeId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "overview" TEXT,
    "focusAreas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResearchGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchGroupMembership" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "researchGroupId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ResearchGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "doi" TEXT,
    "year" INTEGER NOT NULL,
    "type" TEXT,
    "abstract" TEXT,
    "url" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "researchGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationAuthor" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "staffId" TEXT,
    "externalName" TEXT,
    "authorOrder" INTEGER NOT NULL,

    CONSTRAINT "PublicationAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchOutput" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" "ResearchOutputType" NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "venue" TEXT,
    "url" TEXT,
    "doi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResearchOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingResponsibility" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "courseCode" TEXT,
    "title" TEXT NOT NULL,
    "sessionYear" INTEGER,
    "semester" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeachingResponsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentThesis" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ThesisStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StudentThesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipTerm" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" "LeadershipRole" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "programmeCode" "ProgrammeCode",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadershipTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HodAddress" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HodAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicProgram" (
    "id" TEXT NOT NULL,
    "programmeCode" "ProgrammeCode" NOT NULL,
    "level" "ProgramLevel" NOT NULL,
    "slug" TEXT NOT NULL,
    "overviewProspects" TEXT,
    "admissionRequirements" TEXT,
    "courseRequirements" TEXT,
    "curriculum" TEXT,
    "programmeStructure" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AcademicProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementBlock" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "degreeType" "DegreeType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyOption" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StudyOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prerequisites" TEXT,
    "L" INTEGER,
    "T" INTEGER,
    "P" INTEGER,
    "U" INTEGER,
    "status" "CourseStatus" NOT NULL DEFAULT 'CORE',
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOnStudyOption" (
    "courseId" TEXT NOT NULL,
    "studyOptionId" TEXT NOT NULL,

    CONSTRAINT "CourseOnStudyOption_pkey" PRIMARY KEY ("courseId","studyOptionId")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "buttonLabel" TEXT,
    "buttonLink" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "venue" TEXT,
    "link" TEXT,
    "deadline" TIMESTAMP(3),
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EventOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spotlight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "imageUrl" TEXT,
    "text" TEXT NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Spotlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "HistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RollOfHonourEntry" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "programme" TEXT NOT NULL,
    "cgpa" DOUBLE PRECISION,
    "graduatingYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RollOfHonourEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyGalleryItem" (
    "id" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bioText" TEXT NOT NULL,
    "datesText" TEXT,
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LegacyGalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResourceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_institutionalEmail_key" ON "Staff"("institutionalEmail");

-- CreateIndex
CREATE INDEX "Staff_staffStatus_idx" ON "Staff"("staffStatus");

-- CreateIndex
CREATE INDEX "Staff_staffType_idx" ON "Staff"("staffType");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffId_key" ON "User"("staffId");

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_idx" ON "RoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "RoleAssignment_role_scopeType_scopeId_idx" ON "RoleAssignment"("role", "scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_userId_role_scopeType_scopeId_key" ON "RoleAssignment"("userId", "role", "scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchGroup_slug_key" ON "ResearchGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchGroupMembership_staffId_researchGroupId_key" ON "ResearchGroupMembership"("staffId", "researchGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_slug_key" ON "Publication"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_doi_key" ON "Publication"("doi");

-- CreateIndex
CREATE INDEX "Publication_year_idx" ON "Publication"("year");

-- CreateIndex
CREATE INDEX "Publication_researchGroupId_isFeatured_idx" ON "Publication"("researchGroupId", "isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationAuthor_publicationId_authorOrder_key" ON "PublicationAuthor"("publicationId", "authorOrder");

-- CreateIndex
CREATE INDEX "LeadershipTerm_role_endDate_idx" ON "LeadershipTerm"("role", "endDate");

-- CreateIndex
CREATE INDEX "LeadershipTerm_programmeCode_idx" ON "LeadershipTerm"("programmeCode");

-- CreateIndex
CREATE UNIQUE INDEX "HodAddress_staffId_key" ON "HodAddress"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicProgram_slug_key" ON "AcademicProgram"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicProgram_programmeCode_level_key" ON "AcademicProgram"("programmeCode", "level");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementBlock_programId_section_degreeType_key" ON "RequirementBlock"("programId", "section", "degreeType");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_programId_idx" ON "Course"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE INDEX "News_isFeatured_date_idx" ON "News"("isFeatured", "date");

-- CreateIndex
CREATE INDEX "News_status_idx" ON "News"("status");

-- CreateIndex
CREATE INDEX "EventOpportunity_type_deadline_idx" ON "EventOpportunity"("type", "deadline");

-- CreateIndex
CREATE INDEX "EventOpportunity_status_idx" ON "EventOpportunity"("status");

-- CreateIndex
CREATE INDEX "Spotlight_status_idx" ON "Spotlight"("status");

-- CreateIndex
CREATE INDEX "HistoryEntry_date_idx" ON "HistoryEntry"("date");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchGroupMembership" ADD CONSTRAINT "ResearchGroupMembership_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchGroupMembership" ADD CONSTRAINT "ResearchGroupMembership_researchGroupId_fkey" FOREIGN KEY ("researchGroupId") REFERENCES "ResearchGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_researchGroupId_fkey" FOREIGN KEY ("researchGroupId") REFERENCES "ResearchGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAuthor" ADD CONSTRAINT "PublicationAuthor_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAuthor" ADD CONSTRAINT "PublicationAuthor_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchOutput" ADD CONSTRAINT "ResearchOutput_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingResponsibility" ADD CONSTRAINT "TeachingResponsibility_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentThesis" ADD CONSTRAINT "StudentThesis_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipTerm" ADD CONSTRAINT "LeadershipTerm_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HodAddress" ADD CONSTRAINT "HodAddress_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementBlock" ADD CONSTRAINT "RequirementBlock_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AcademicProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyOption" ADD CONSTRAINT "StudyOption_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AcademicProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AcademicProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOnStudyOption" ADD CONSTRAINT "CourseOnStudyOption_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOnStudyOption" ADD CONSTRAINT "CourseOnStudyOption_studyOptionId_fkey" FOREIGN KEY ("studyOptionId") REFERENCES "StudyOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
