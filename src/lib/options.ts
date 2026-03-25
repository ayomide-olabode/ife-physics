import {
  CourseStatus,
  DegreeScope,
  DegreeType,
  EventCategory,
  EventOpportunityType,
  LeadershipRole,
  OpportunityCategory,
  ProgrammeCode,
  ProgrammeScope,
  PublishStatus,
  RequirementType,
  ResearchOutputType,
  ScopedRole,
  StaffStatus,
  StaffType,
  ThesisStatus,
  SemesterTaken,
} from '@prisma/client';

export const PROGRAMME_OPTIONS = [
  { value: ProgrammeCode.PHY, label: 'Physics' },
  { value: ProgrammeCode.EPH, label: 'Engineering Physics' },
  { value: ProgrammeCode.SLT, label: 'Science Laboratory Technology' },
];

export const PROGRAMME_SCOPE_OPTIONS = [
  { value: ProgrammeScope.GENERAL, label: 'General' },
  { value: ProgrammeScope.PHY, label: 'Physics' },
  { value: ProgrammeScope.EPH, label: 'Engineering Physics' },
  { value: ProgrammeScope.SLT, label: 'Science Laboratory Technology' },
];

export const DEGREE_SCOPE_OPTIONS = [
  { value: DegreeScope.GENERAL, label: 'General' },
  { value: DegreeScope.UNDERGRADUATE, label: 'Undergraduate' },
  { value: DegreeScope.POSTGRADUATE, label: 'Postgraduate' },
];

/** Roll-of-Honour programme options – stored as display strings, not enum codes */
export const ROH_PROGRAMME_OPTIONS = [
  { value: 'Physics', label: 'Physics' },
  { value: 'Engineering Physics', label: 'Engineering Physics' },
  { value: 'Science Laboratory Technology', label: 'Science Laboratory Technology' },
] as const;

export const ROH_PROGRAMME_VALUES = ROH_PROGRAMME_OPTIONS.map((o) => o.value);

export const DEGREE_OPTIONS = [
  { value: DegreeType.BSC, label: 'B.Sc.' },
  { value: DegreeType.MPHIL, label: 'M.Phil.' },
  { value: DegreeType.MSC, label: 'M.Sc.' },
  { value: DegreeType.PHD, label: 'Ph.D.' },
];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'ONGOING', label: 'Ongoing' },
];

export const THESIS_STATUS_OPTIONS = [
  { value: ThesisStatus.COMPLETED, label: 'Completed' },
  { value: ThesisStatus.DISCONTINUED, label: 'Discontinued' },
  { value: ThesisStatus.ONGOING, label: 'Ongoing' },
];

export const RESEARCH_OUTPUT_TYPE_OPTIONS = [
  { value: ResearchOutputType.BOOK, label: 'Book' },
  { value: ResearchOutputType.BOOK_CHAPTER, label: 'Book Chapter' },
  { value: ResearchOutputType.CONFERENCE_PAPER, label: 'Conference Paper' },
  { value: ResearchOutputType.DATA, label: 'Data' },
  { value: ResearchOutputType.JOURNAL_ARTICLE, label: 'Journal Article' },
  { value: ResearchOutputType.MONOGRAPH, label: 'Monograph' },
  { value: ResearchOutputType.OTHER, label: 'Other' },
  { value: ResearchOutputType.PATENT, label: 'Patent' },
  { value: ResearchOutputType.REPORT, label: 'Report' },
  { value: ResearchOutputType.SOFTWARE, label: 'Software' },
  { value: ResearchOutputType.THESIS, label: 'Thesis' },
];

const ACADEMIC_FACULTY_RANK_VALUES = [
  'Professor',
  'Reader',
  'Senior Lecturer',
  'Lecturer I',
  'Lecturer II',
  'Assistant Lecturer',
  'Graduate Assistant',
] as const;

const TECHNICAL_STAFF_RANK_VALUES = [
  'Principal Chief Technologist',
  'Senior Chief Technologist',
  'Chief Technologist',
  'Assistant Chief Technologist',
  'Principal Technologist',
  'Senior Technologist',
  'Technologist I',
  'Technologist II',
  'Senior Laboratory Technician',
  'Senior Laboratory Superintendent',
  'Laboratory Superintendent',
  'Senior Laboratory Supervisor',
  'Laboratory Supervisor',
  'Senior Laboratory Assistant',
  'Laboratory Assistant',
] as const;

const SUPPORT_STAFF_RANK_VALUES = [
  'Confidential Secretary',
  'Executive Officer',
  'Clerical Officer',
  'Office Assistant',
] as const;

export const ACADEMIC_RANK_VALUES = ACADEMIC_FACULTY_RANK_VALUES;

export const STAFF_RANK_VALUES_BY_TYPE: Record<StaffType, readonly string[]> = {
  [StaffType.ACADEMIC]: ACADEMIC_FACULTY_RANK_VALUES,
  [StaffType.VISITING]: ACADEMIC_FACULTY_RANK_VALUES,
  [StaffType.EMERITUS]: ['Professor'],
  [StaffType.TECHNICAL]: TECHNICAL_STAFF_RANK_VALUES,
  [StaffType.SUPPORT]: SUPPORT_STAFF_RANK_VALUES,
};

export const STAFF_RANK_VALUES = Array.from(
  new Set(Object.values(STAFF_RANK_VALUES_BY_TYPE).flat()),
);

export function getStaffRankValuesByType(staffType: StaffType): readonly string[] {
  return STAFF_RANK_VALUES_BY_TYPE[staffType] ?? [];
}

export function getStaffRankOptionsByType(staffType: StaffType) {
  return getStaffRankValuesByType(staffType).map((rank) => ({
    value: rank,
    label: rank,
  }));
}

export const ACADEMIC_RANK_OPTIONS = getStaffRankOptionsByType(StaffType.ACADEMIC);

export const STAFF_TITLE_OPTIONS = [
  'Prof.',
  'Prof. (Mrs.)',
  'Prof. (Ms.)',
  'Dr.',
  'Dr. (Mrs.)',
  'Dr. (Ms.)',
  'Mr.',
  'Mrs.',
  'Ms.',
] as const;

export const STAFF_TYPE_OPTIONS = [
  { value: StaffType.ACADEMIC, label: 'Academic Faculty' },
  { value: StaffType.VISITING, label: 'Visiting Faculty' },
  { value: StaffType.EMERITUS, label: 'Emeritus Faculty' },
  { value: StaffType.TECHNICAL, label: 'Technical Staff' },
  { value: StaffType.SUPPORT, label: 'Support Staff' },
];

export const STAFF_STATUS_OPTIONS = [
  { value: StaffStatus.ACTIVE, label: 'Active' },
  { value: StaffStatus.IN_MEMORIAM, label: 'In Memoriam' },
  { value: StaffStatus.FORMER, label: 'Former Staff' },
  { value: StaffStatus.RETIRED, label: 'Retired' },
];

export const PUBLISH_STATUS_OPTIONS = [
  { value: PublishStatus.ARCHIVED, label: 'Archived' },
  { value: PublishStatus.DRAFT, label: 'Draft' },
  { value: PublishStatus.PUBLISHED, label: 'Published' },
];

export const PUBLISH_STATUS_OPTIONS_WITH_ALL = [
  { value: 'ALL', label: 'All Statuses' },
  ...PUBLISH_STATUS_OPTIONS,
];

export const COURSE_STATUS_OPTIONS = [
  { value: CourseStatus.CORE, label: 'Core' },
  { value: CourseStatus.RESTRICTED, label: 'Restricted' },
];

export const COURSE_SEMESTER_OPTIONS = [
  { value: SemesterTaken.HARMATTAN, label: 'Harmattan' },
  { value: SemesterTaken.RAIN, label: 'Rain' },
];
export const EVENT_OPPORTUNITY_TYPE_OPTIONS = [
  { value: EventOpportunityType.EVENT, label: 'Event' },
  { value: EventOpportunityType.OPPORTUNITY, label: 'Opportunity' },
];

export const EVENT_CATEGORY_OPTIONS = [
  { value: EventCategory.COLLOQUIUM, label: 'Colloquium' },
  { value: EventCategory.COMPETITION, label: 'Competition' },
  { value: EventCategory.CONFERENCE, label: 'Conference' },
  { value: EventCategory.LECTURE, label: 'Lecture' },
  { value: EventCategory.MEETING, label: 'Meeting' },
  { value: EventCategory.OUTREACH, label: 'Outreach' },
  { value: EventCategory.SCHOOL, label: 'School' },
  { value: EventCategory.SEMINAR, label: 'Seminar' },
  { value: EventCategory.SOCIAL, label: 'Social' },
  { value: EventCategory.SYMPOSIUM, label: 'Symposium' },
  { value: EventCategory.THESIS_DEFENSE, label: 'Thesis Defense' },
  { value: EventCategory.TRAINING, label: 'Training' },
  { value: EventCategory.WORKSHOP, label: 'Workshop' },
];

export const OPPORTUNITY_CATEGORY_OPTIONS = [
  { value: OpportunityCategory.COLLABORATION, label: 'Collaboration' },
  { value: OpportunityCategory.EXCHANGE, label: 'Exchange' },
  { value: OpportunityCategory.FELLOWSHIP, label: 'Fellowship' },
  { value: OpportunityCategory.FUNDING, label: 'Funding' },
  { value: OpportunityCategory.GRANT, label: 'Grant' },
  { value: OpportunityCategory.INTERNSHIPS, label: 'Internships' },
  { value: OpportunityCategory.JOBS, label: 'Jobs' },
  { value: OpportunityCategory.SCHOLARSHIP, label: 'Scholarship' },
];
export const REQUIREMENT_TYPE_OPTIONS = [
  { value: RequirementType.ADMISSION, label: 'Admission' },
  { value: RequirementType.COURSE, label: 'Course' },
];

export const SCOPED_ROLE_OPTIONS = [
  {
    value: ScopedRole.ACADEMIC_COORDINATOR,
    label: 'Academic Coordinator (Programme + Degree Scoped)',
  },
  { value: ScopedRole.EDITOR, label: 'Editor (Global)' },
  { value: ScopedRole.RESEARCH_LEAD, label: 'Research Lead (Scoped)' },
];

export const LEADERSHIP_ROLE_OPTIONS = [
  { value: LeadershipRole.ACADEMIC_COORDINATOR, label: 'Academic Coordinator' },
  { value: LeadershipRole.HOD, label: 'Head of Department' },
];
