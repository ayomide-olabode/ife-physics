'use strict';

const DOMAIN_PLAN = [
  { domain: 'people_staff', tables: ['SecondaryAffiliation', 'Staff'] },
  { domain: 'identity_auth', tables: ['User'] },
  {
    domain: 'governance_admin_core',
    tables: ['RoleAssignment', 'LeadershipTerm', 'HodAddress', 'DepartmentalTribute', 'TributeTestimonial'],
  },
  { domain: 'research_roots', tables: ['ResearchGroup', 'FocusArea'] },
  {
    domain: 'research_outputs_and_dependents',
    tables: [
      'ResearchOutput',
      'Project',
      'TeachingResponsibility',
      'StudentThesis',
      'Publication',
      'PublicationAuthor',
      'ResearchGroupMembership',
      'StaffFocusAreaSelection',
    ],
  },
  {
    domain: 'academics',
    tables: [
      'AcademicProgram',
      'PgDegreeContent',
      'StudyOption',
      'Course',
      'RequirementBlock',
      'ProgramStudyOption',
      'CourseOnStudyOption',
    ],
  },
  {
    domain: 'content_domain',
    tables: [
      'News',
      'EventOpportunity',
      'Spotlight',
      'HistoryEntry',
      'RollOfHonourEntry',
      'LegacyGalleryItem',
      'ResourceItem',
    ],
  },
  { domain: 'late_tables', tables: ['EmailToken', 'AuditLog'] },
];

const TABLE_ORDER = DOMAIN_PLAN.flatMap((entry) => entry.tables);

const PRIMARY_KEYS = {
  CourseOnStudyOption: ['courseId', 'studyOptionId'],
  ProgramStudyOption: ['id'],
  RoleAssignment: ['id'],
  ResearchGroupMembership: ['id'],
  StaffFocusAreaSelection: ['id'],
  PublicationAuthor: ['id'],
};

const DEFAULT_PRIMARY_KEY = ['id'];

const DEFERRED_NULL_ON_LOAD = {
  ResearchGroup: ['featuredResearchOutputId'],
};

const DEFERRED_UPDATES = [
  {
    name: 'research_group_featured_research_output',
    table: 'ResearchGroup',
    idField: 'id',
    field: 'featuredResearchOutputId',
    referencesTable: 'ResearchOutput',
    referencesField: 'id',
  },
];

const JSON_FIELDS = {
  ResearchOutput: ['authorsJson', 'keywordsJson', 'metaJson'],
  AuditLog: ['snapshot'],
};

const CASE_UNIQUE_RULES = [
  { table: 'Staff', name: 'staff_institutional_email_ci', fields: ['institutionalEmail'] },
  { table: 'ResearchGroup', name: 'research_group_slug_ci', fields: ['slug'] },
  { table: 'Publication', name: 'publication_slug_ci', fields: ['slug'] },
  { table: 'Publication', name: 'publication_doi_ci', fields: ['doi'] },
  { table: 'News', name: 'news_slug_ci', fields: ['slug'] },
  { table: 'Course', name: 'course_code_ci', fields: ['code'] },
  { table: 'StudyOption', name: 'study_option_slug_ci', fields: ['slug'] },
  { table: 'AcademicProgram', name: 'academic_program_slug_ci', fields: ['slug'] },
];

const ONE_TO_ONE_RULES = [
  { table: 'User', name: 'user_staff_unique', fields: ['staffId'] },
  { table: 'HodAddress', name: 'hod_address_staff_unique', fields: ['staffId'] },
  { table: 'DepartmentalTribute', name: 'departmental_tribute_staff_unique', fields: ['staffId'] },
];

const COMPOUND_UNIQUE_RULES = [
  {
    table: 'RoleAssignment',
    name: 'role_assignment_unique_scope',
    fields: ['userId', 'role', 'scopeType', 'scopeId'],
  },
  {
    table: 'ResearchGroupMembership',
    name: 'research_group_membership_unique',
    fields: ['staffId', 'researchGroupId'],
  },
  {
    table: 'StaffFocusAreaSelection',
    name: 'staff_focus_area_selection_unique',
    fields: ['staffId', 'focusAreaId'],
  },
  {
    table: 'PublicationAuthor',
    name: 'publication_author_order_unique',
    fields: ['publicationId', 'authorOrder'],
  },
  {
    table: 'ProgramStudyOption',
    name: 'program_study_option_unique_legacy',
    fields: ['programmeCode', 'level', 'studyOptionId'],
  },
  {
    table: 'ProgramStudyOption',
    name: 'program_study_option_unique_program',
    fields: ['academicProgramId', 'studyOptionId'],
  },
  {
    table: 'CourseOnStudyOption',
    name: 'course_on_study_option_pk',
    fields: ['courseId', 'studyOptionId'],
  },
  {
    table: 'AcademicProgram',
    name: 'academic_program_programme_level_unique',
    fields: ['programmeCode', 'level'],
  },
  {
    table: 'PgDegreeContent',
    name: 'pg_degree_content_programme_degree_unique',
    fields: ['programmeCode', 'degreeType'],
  },
  {
    table: 'Publication',
    name: 'publication_slug_unique',
    fields: ['slug'],
  },
  {
    table: 'Publication',
    name: 'publication_doi_unique',
    fields: ['doi'],
  },
  {
    table: 'News',
    name: 'news_slug_unique',
    fields: ['slug'],
  },
  {
    table: 'Course',
    name: 'course_code_unique',
    fields: ['code'],
  },
];

const TABLE_CONFLICT_POLICIES = {
  RoleAssignment: {
    conflictKeyFields: ['userId', 'role', 'scopeType', 'scopeId'],
    name: 'role_assignment_unique_scope_resolution_v1',
    ruleName: 'role_assignment_unique_scope',
    table: 'RoleAssignment',
  },
};

const FK_RULES = [
  { table: 'Staff', field: 'secondaryAffiliationId', referencesTable: 'SecondaryAffiliation', referencesField: 'id' },
  { table: 'DepartmentalTribute', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'TributeTestimonial', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'User', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'EmailToken', field: 'userId', referencesTable: 'User', referencesField: 'id' },
  { table: 'EmailToken', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'RoleAssignment', field: 'userId', referencesTable: 'User', referencesField: 'id' },
  {
    table: 'ResearchGroup',
    field: 'featuredResearchOutputId',
    referencesTable: 'ResearchOutput',
    referencesField: 'id',
    deferred: true,
  },
  { table: 'FocusArea', field: 'researchGroupId', referencesTable: 'ResearchGroup', referencesField: 'id' },
  { table: 'StaffFocusAreaSelection', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'StaffFocusAreaSelection', field: 'focusAreaId', referencesTable: 'FocusArea', referencesField: 'id' },
  { table: 'ResearchGroupMembership', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  {
    table: 'ResearchGroupMembership',
    field: 'researchGroupId',
    referencesTable: 'ResearchGroup',
    referencesField: 'id',
  },
  { table: 'Publication', field: 'researchGroupId', referencesTable: 'ResearchGroup', referencesField: 'id' },
  { table: 'PublicationAuthor', field: 'publicationId', referencesTable: 'Publication', referencesField: 'id' },
  { table: 'PublicationAuthor', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'ResearchOutput', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'Project', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'TeachingResponsibility', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'StudentThesis', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'LeadershipTerm', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'HodAddress', field: 'staffId', referencesTable: 'Staff', referencesField: 'id' },
  { table: 'RequirementBlock', field: 'programId', referencesTable: 'AcademicProgram', referencesField: 'id' },
  {
    table: 'ProgramStudyOption',
    field: 'academicProgramId',
    referencesTable: 'AcademicProgram',
    referencesField: 'id',
  },
  { table: 'ProgramStudyOption', field: 'studyOptionId', referencesTable: 'StudyOption', referencesField: 'id' },
  { table: 'Course', field: 'programId', referencesTable: 'AcademicProgram', referencesField: 'id' },
  { table: 'CourseOnStudyOption', field: 'courseId', referencesTable: 'Course', referencesField: 'id' },
  { table: 'CourseOnStudyOption', field: 'studyOptionId', referencesTable: 'StudyOption', referencesField: 'id' },
  { table: 'AuditLog', field: 'actorId', referencesTable: 'User', referencesField: 'id' },
];

function getPrimaryKey(table) {
  return PRIMARY_KEYS[table] ?? DEFAULT_PRIMARY_KEY;
}

module.exports = {
  CASE_UNIQUE_RULES,
  COMPOUND_UNIQUE_RULES,
  DEFAULT_PRIMARY_KEY,
  DEFERRED_NULL_ON_LOAD,
  DEFERRED_UPDATES,
  DOMAIN_PLAN,
  FK_RULES,
  JSON_FIELDS,
  ONE_TO_ONE_RULES,
  TABLE_CONFLICT_POLICIES,
  TABLE_ORDER,
  getPrimaryKey,
};
