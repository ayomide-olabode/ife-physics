-- CreateTable
CREATE TABLE `SecondaryAffiliation` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `acronym` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SecondaryAffiliation_name_idx`(`name`),
    INDEX `SecondaryAffiliation_acronym_idx`(`acronym`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Staff` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `middleName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `institutionalEmail` VARCHAR(191) NOT NULL,
    `staffType` ENUM('ACADEMIC', 'VISITING', 'EMERITUS', 'TECHNICAL', 'SUPPORT') NOT NULL,
    `staffStatus` ENUM('ACTIVE', 'FORMER', 'RETIRED', 'IN_MEMORIAM') NOT NULL DEFAULT 'ACTIVE',
    `secondaryAffiliationId` VARCHAR(191) NULL,
    `visitStartDate` DATETIME(3) NULL,
    `visitEndDate` DATETIME(3) NULL,
    `academicRank` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NULL,
    `researchArea` VARCHAR(191) NULL,
    `roomNumber` VARCHAR(191) NULL,
    `academicLinkUrl` VARCHAR(191) NULL,
    `operationalUnit` VARCHAR(191) NULL,
    `areaOfExpertise` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `bio` LONGTEXT NULL,
    `education` LONGTEXT NULL,
    `researchInterests` LONGTEXT NULL,
    `membershipOfProfessionalOrganizations` LONGTEXT NULL,
    `profileImageUrl` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `dateOfDeath` DATETIME(3) NULL,
    `isInMemoriam` BOOLEAN NOT NULL DEFAULT false,
    `isPublicProfile` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Staff_institutionalEmail_key`(`institutionalEmail`),
    INDEX `Staff_staffStatus_idx`(`staffStatus`),
    INDEX `Staff_staffType_idx`(`staffType`),
    INDEX `Staff_isPublicProfile_idx`(`isPublicProfile`),
    INDEX `Staff_secondaryAffiliationId_idx`(`secondaryAffiliationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DepartmentalTribute` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `bodyHtml` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DepartmentalTribute_staffId_key`(`staffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TributeTestimonial` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `relationship` VARCHAR(191) NOT NULL,
    `tributeHtml` LONGTEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewerUserId` VARCHAR(191) NULL,
    `declineReason` VARCHAR(191) NULL,

    INDEX `TributeTestimonial_staffId_status_submittedAt_idx`(`staffId`, `status`, `submittedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_staffId_key`(`staffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailToken` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('INVITE', 'PASSWORD_RESET') NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `staffId` VARCHAR(191) NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `lastSentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmailToken_tokenHash_key`(`tokenHash`),
    INDEX `EmailToken_email_type_idx`(`email`, `type`),
    INDEX `EmailToken_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('ACADEMIC_COORDINATOR', 'RESEARCH_LEAD', 'EDITOR') NOT NULL,
    `scopeType` ENUM('GLOBAL', 'RESEARCH_GROUP') NOT NULL,
    `scopeId` VARCHAR(191) NULL,
    `programmeScope` ENUM('GENERAL', 'PHY', 'EPH', 'SLT') NULL,
    `degreeScope` ENUM('GENERAL', 'UNDERGRADUATE', 'POSTGRADUATE') NULL,
    `expiresAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RoleAssignment_userId_idx`(`userId`),
    INDEX `RoleAssignment_role_scopeType_scopeId_idx`(`role`, `scopeType`, `scopeId`),
    INDEX `RoleAssignment_role_programmeScope_degreeScope_idx`(`role`, `programmeScope`, `degreeScope`),
    INDEX `RoleAssignment_userId_role_deletedAt_idx`(`userId`, `role`, `deletedAt`),
    UNIQUE INDEX `RoleAssignment_userId_role_scopeType_scopeId_key`(`userId`, `role`, `scopeType`, `scopeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResearchGroup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `abbreviation` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `heroImageUrl` VARCHAR(191) NULL,
    `overview` LONGTEXT NULL,
    `featuredResearchOutputId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ResearchGroup_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FocusArea` (
    `id` VARCHAR(191) NOT NULL,
    `researchGroupId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `FocusArea_researchGroupId_idx`(`researchGroupId`),
    INDEX `FocusArea_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffFocusAreaSelection` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `focusAreaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StaffFocusAreaSelection_staffId_idx`(`staffId`),
    INDEX `StaffFocusAreaSelection_focusAreaId_idx`(`focusAreaId`),
    UNIQUE INDEX `StaffFocusAreaSelection_staffId_focusAreaId_key`(`staffId`, `focusAreaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResearchGroupMembership` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `researchGroupId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NULL,
    `leftAt` DATETIME(3) NULL,

    UNIQUE INDEX `ResearchGroupMembership_staffId_researchGroupId_key`(`staffId`, `researchGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Publication` (
    `id` VARCHAR(191) NOT NULL,
    `title` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `doi` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `type` VARCHAR(191) NULL,
    `abstract` LONGTEXT NULL,
    `url` TEXT NULL,
    `authors` LONGTEXT NULL,
    `venue` TEXT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `researchGroupId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Publication_slug_key`(`slug`),
    UNIQUE INDEX `Publication_doi_key`(`doi`),
    INDEX `Publication_year_idx`(`year`),
    INDEX `Publication_researchGroupId_isFeatured_idx`(`researchGroupId`, `isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PublicationAuthor` (
    `id` VARCHAR(191) NOT NULL,
    `publicationId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NULL,
    `externalName` VARCHAR(191) NULL,
    `authorOrder` INTEGER NOT NULL,

    UNIQUE INDEX `PublicationAuthor_publicationId_authorOrder_key`(`publicationId`, `authorOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResearchOutput` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `type` ENUM('BOOK', 'BOOK_CHAPTER', 'CONFERENCE_PAPER', 'DATA', 'JOURNAL_ARTICLE', 'MONOGRAPH', 'OTHER', 'PATENT', 'REPORT', 'SOFTWARE', 'THESIS') NOT NULL,
    `title` TEXT NOT NULL,
    `authors` LONGTEXT NOT NULL,
    `year` INTEGER NULL,
    `venue` TEXT NULL,
    `url` TEXT NULL,
    `doi` VARCHAR(191) NULL,
    `groupAuthor` VARCHAR(191) NULL,
    `fullDate` DATETIME(3) NULL,
    `subtitle` VARCHAR(191) NULL,
    `sourceTitle` VARCHAR(191) NULL,
    `publisher` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `abstract` LONGTEXT NULL,
    `notes` LONGTEXT NULL,
    `authorsJson` JSON NULL,
    `keywordsJson` JSON NULL,
    `metaJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `acronym` VARCHAR(191) NULL,
    `descriptionHtml` LONGTEXT NULL,
    `url` TEXT NULL,
    `status` ENUM('COMPLETED', 'DISCONTINUED', 'ONGOING') NOT NULL DEFAULT 'ONGOING',
    `isFunded` BOOLEAN NOT NULL DEFAULT false,
    `startYear` INTEGER NOT NULL DEFAULT 2025,
    `endYear` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeachingResponsibility` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `courseCode` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `sessionYear` INTEGER NULL,
    `semester` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentThesis` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `title` TEXT NOT NULL,
    `studentName` VARCHAR(191) NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `programme` VARCHAR(191) NULL,
    `degreeLevel` VARCHAR(191) NULL,
    `externalUrl` TEXT NULL,
    `status` ENUM('ONGOING', 'COMPLETED', 'DISCONTINUED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadershipTerm` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `role` ENUM('HOD', 'ACADEMIC_COORDINATOR') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `programmeCode` ENUM('PHY', 'EPH', 'SLT') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadershipTerm_role_endDate_idx`(`role`, `endDate`),
    INDEX `LeadershipTerm_programmeCode_idx`(`programmeCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HodAddress` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HodAddress_staffId_key`(`staffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademicProgram` (
    `id` VARCHAR(191) NOT NULL,
    `programmeCode` ENUM('PHY', 'EPH', 'SLT') NOT NULL,
    `level` ENUM('UNDERGRADUATE', 'POSTGRADUATE') NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `overviewProspects` LONGTEXT NULL,
    `admissionRequirements` LONGTEXT NULL,
    `courseRequirements` LONGTEXT NULL,
    `curriculum` LONGTEXT NULL,
    `programmeStructure` LONGTEXT NULL,
    `studyOptionsText` LONGTEXT NULL,
    `courseDescriptionsIntro` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `AcademicProgram_slug_key`(`slug`),
    UNIQUE INDEX `AcademicProgram_programmeCode_level_key`(`programmeCode`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PgDegreeContent` (
    `id` VARCHAR(191) NOT NULL,
    `programmeCode` ENUM('PHY', 'EPH', 'SLT') NOT NULL,
    `degreeType` ENUM('BSC', 'MSC', 'MPHIL', 'PHD') NOT NULL,
    `admissionHtml` LONGTEXT NOT NULL,
    `periodHtml` LONGTEXT NOT NULL,
    `courseHtml` LONGTEXT NOT NULL,
    `examHtml` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PgDegreeContent_programmeCode_degreeType_key`(`programmeCode`, `degreeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequirementBlock` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `degreeType` ENUM('BSC', 'MSC', 'MPHIL', 'PHD') NOT NULL,
    `requirementType` ENUM('ADMISSION', 'COURSE') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `contentHtml` LONGTEXT NOT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `RequirementBlock_programId_degreeType_requirementType_idx`(`programId`, `degreeType`, `requirementType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudyOption` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `about` LONGTEXT NOT NULL,
    `slug` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `StudyOption_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProgramStudyOption` (
    `id` VARCHAR(191) NOT NULL,
    `programmeCode` ENUM('PHY', 'EPH', 'SLT') NOT NULL,
    `level` ENUM('UNDERGRADUATE', 'POSTGRADUATE') NOT NULL,
    `academicProgramId` VARCHAR(191) NOT NULL,
    `studyOptionId` VARCHAR(191) NOT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProgramStudyOption_academicProgramId_idx`(`academicProgramId`),
    INDEX `ProgramStudyOption_studyOptionId_idx`(`studyOptionId`),
    UNIQUE INDEX `ProgramStudyOption_programmeCode_level_studyOptionId_key`(`programmeCode`, `level`, `studyOptionId`),
    UNIQUE INDEX `ProgramStudyOption_academicProgramId_studyOptionId_key`(`academicProgramId`, `studyOptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `prerequisites` LONGTEXT NULL,
    `L` INTEGER NULL,
    `T` INTEGER NULL,
    `P` INTEGER NULL,
    `U` INTEGER NULL,
    `yearLevel` INTEGER NULL,
    `semesterTaken` ENUM('HARMATTAN', 'RAIN') NULL,
    `status` ENUM('CORE', 'RESTRICTED') NOT NULL DEFAULT 'CORE',
    `programId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Course_code_key`(`code`),
    INDEX `Course_programId_idx`(`programId`),
    INDEX `Course_yearLevel_idx`(`yearLevel`),
    INDEX `Course_semesterTaken_idx`(`semesterTaken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseOnStudyOption` (
    `courseId` VARCHAR(191) NOT NULL,
    `studyOptionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`courseId`, `studyOptionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `News` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `buttonLabel` VARCHAR(191) NULL,
    `buttonLink` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `News_slug_key`(`slug`),
    INDEX `News_isFeatured_date_idx`(`isFeatured`, `date`),
    INDEX `News_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventOpportunity` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` ENUM('EVENT', 'OPPORTUNITY') NOT NULL,
    `eventCategory` ENUM('SEMINAR', 'LECTURE', 'COLLOQUIUM', 'WORKSHOP', 'TRAINING', 'THESIS_DEFENSE', 'CONFERENCE', 'SYMPOSIUM', 'SCHOOL', 'MEETING', 'SOCIAL', 'OUTREACH', 'COMPETITION') NULL,
    `opportunityCategory` ENUM('GRANT', 'FUNDING', 'FELLOWSHIP', 'SCHOLARSHIP', 'JOBS', 'INTERNSHIPS', 'EXCHANGE', 'COLLABORATION') NULL,
    `description` LONGTEXT NULL,
    `duration` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `venue` VARCHAR(191) NULL,
    `linkUrl` TEXT NULL,
    `deadline` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `EventOpportunity_type_deadline_idx`(`type`, `deadline`),
    INDEX `EventOpportunity_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Spotlight` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `text` LONGTEXT NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Spotlight_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoryEntry` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `year` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `shortDesc` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `HistoryEntry_date_idx`(`date`),
    INDEX `HistoryEntry_year_idx`(`year`),
    INDEX `HistoryEntry_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RollOfHonourEntry` (
    `id` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `middleName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `registrationNumber` VARCHAR(191) NOT NULL,
    `programme` VARCHAR(191) NOT NULL,
    `cgpa` DOUBLE NOT NULL,
    `graduatingYear` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LegacyGalleryItem` (
    `id` VARCHAR(191) NOT NULL,
    `mediaUrl` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `bioText` LONGTEXT NOT NULL,
    `datesText` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResourceItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `link` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `snapshot` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Staff` ADD CONSTRAINT `Staff_secondaryAffiliationId_fkey` FOREIGN KEY (`secondaryAffiliationId`) REFERENCES `SecondaryAffiliation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DepartmentalTribute` ADD CONSTRAINT `DepartmentalTribute_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TributeTestimonial` ADD CONSTRAINT `TributeTestimonial_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailToken` ADD CONSTRAINT `EmailToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailToken` ADD CONSTRAINT `EmailToken_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleAssignment` ADD CONSTRAINT `RoleAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResearchGroup` ADD CONSTRAINT `ResearchGroup_featuredResearchOutputId_fkey` FOREIGN KEY (`featuredResearchOutputId`) REFERENCES `ResearchOutput`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FocusArea` ADD CONSTRAINT `FocusArea_researchGroupId_fkey` FOREIGN KEY (`researchGroupId`) REFERENCES `ResearchGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffFocusAreaSelection` ADD CONSTRAINT `StaffFocusAreaSelection_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffFocusAreaSelection` ADD CONSTRAINT `StaffFocusAreaSelection_focusAreaId_fkey` FOREIGN KEY (`focusAreaId`) REFERENCES `FocusArea`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResearchGroupMembership` ADD CONSTRAINT `ResearchGroupMembership_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResearchGroupMembership` ADD CONSTRAINT `ResearchGroupMembership_researchGroupId_fkey` FOREIGN KEY (`researchGroupId`) REFERENCES `ResearchGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publication` ADD CONSTRAINT `Publication_researchGroupId_fkey` FOREIGN KEY (`researchGroupId`) REFERENCES `ResearchGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PublicationAuthor` ADD CONSTRAINT `PublicationAuthor_publicationId_fkey` FOREIGN KEY (`publicationId`) REFERENCES `Publication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PublicationAuthor` ADD CONSTRAINT `PublicationAuthor_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResearchOutput` ADD CONSTRAINT `ResearchOutput_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeachingResponsibility` ADD CONSTRAINT `TeachingResponsibility_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentThesis` ADD CONSTRAINT `StudentThesis_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadershipTerm` ADD CONSTRAINT `LeadershipTerm_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HodAddress` ADD CONSTRAINT `HodAddress_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequirementBlock` ADD CONSTRAINT `RequirementBlock_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `AcademicProgram`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramStudyOption` ADD CONSTRAINT `ProgramStudyOption_academicProgramId_fkey` FOREIGN KEY (`academicProgramId`) REFERENCES `AcademicProgram`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramStudyOption` ADD CONSTRAINT `ProgramStudyOption_studyOptionId_fkey` FOREIGN KEY (`studyOptionId`) REFERENCES `StudyOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `AcademicProgram`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseOnStudyOption` ADD CONSTRAINT `CourseOnStudyOption_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseOnStudyOption` ADD CONSTRAINT `CourseOnStudyOption_studyOptionId_fkey` FOREIGN KEY (`studyOptionId`) REFERENCES `StudyOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
