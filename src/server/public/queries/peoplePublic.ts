import 'server-only';

import prisma from '@/lib/prisma';
import { getAcademicRankSortValue } from '@/lib/rankOrder';
import { buildStaffSlug, slugify } from '@/lib/slug';
import { unstable_cache } from 'next/cache';
import { Prisma, StaffStatus, StaffType } from '@prisma/client';
import type { AuthorObject } from '@/lib/researchOutputTypes';

const PUBLIC_VISIBLE_STAFF_STATUSES: StaffStatus[] = ['ACTIVE', 'RETIRED', 'IN_MEMORIAM'];
const FORMER_STATUS: StaffStatus = 'FORMER';

// Map public route categories to StaffType + StaffStatus filters
const CATEGORY_MAP: Record<string, { staffType?: StaffType; staffStatus?: StaffStatus }> = {
  'academic-faculty': { staffType: 'ACADEMIC', staffStatus: 'ACTIVE' },
  'visiting-faculty': { staffType: 'VISITING', staffStatus: 'ACTIVE' },
  'emeritus-faculty': { staffType: 'EMERITUS', staffStatus: 'ACTIVE' },
  'technical-staff': { staffType: 'TECHNICAL', staffStatus: 'ACTIVE' },
  'support-staff': { staffType: 'SUPPORT', staffStatus: 'ACTIVE' },
  'retired-staff': { staffStatus: 'RETIRED' },
  'in-memoriam': { staffStatus: 'IN_MEMORIAM' },
};

export type PublicPeopleCategory = keyof typeof CATEGORY_MAP;
export type PublicPeopleSort = 'default' | 'name-asc' | 'name-desc';
export type PublicPeopleFilters = {
  rank?: string;
  researchGroupSlug?: string;
  secondaryAffiliationId?: string;
  formerStaffType?: StaffType;
  alpha?: string;
};

type StaffSlugIdentity = {
  id: string;
  title: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  institutionalEmail: string;
};

function wherePublicVisibleStaff(): Prisma.StaffWhereInput {
  return {
    deletedAt: null,
    isPublicProfile: true,
    staffStatus: { not: FORMER_STATUS },
    OR: [{ staffStatus: { in: PUBLIC_VISIBLE_STAFF_STATUSES } }, { isInMemoriam: true }],
  };
}

const getCachedPublicStaffSlugIndex = unstable_cache(
  async () => {
    const slugRows = await prisma.staff.findMany({
      where: wherePublicVisibleStaff(),
      select: {
        id: true,
        title: true,
        firstName: true,
        middleName: true,
        lastName: true,
        institutionalEmail: true,
      },
    });

    const slugById = buildUniqueStaffSlugs(slugRows);
    const idBySlug: Record<string, string> = {};
    const computedSlugById: Record<string, string> = {};

    for (const [staffId, computedSlug] of slugById.entries()) {
      computedSlugById[staffId] = computedSlug;
      idBySlug[computedSlug] = staffId;
    }

    return { idBySlug, computedSlugById };
  },
  ['public-staff-slug-index'],
  {
    revalidate: 60,
    tags: ['public:staff-slug-index'],
  },
);

async function resolvePublicStaffSlug(slug: string): Promise<{ staffId: string; computedSlug: string } | null> {
  const normalizedSlug = slugify(slug);
  if (!normalizedSlug) return null;

  const index = await getCachedPublicStaffSlugIndex();
  const staffId = index.idBySlug[normalizedSlug];
  if (!staffId) return null;

  return { staffId, computedSlug: normalizedSlug };
}

export async function getPublicStaffSlugsByIds(staffIds: string[]): Promise<Map<string, string>> {
  if (staffIds.length === 0) return new Map();

  const index = await getCachedPublicStaffSlugIndex();
  const slugById = new Map<string, string>();

  for (const staffId of staffIds) {
    const computedSlug = index.computedSlugById[staffId];
    if (computedSlug) {
      slugById.set(staffId, computedSlug);
    }
  }

  return slugById;
}

function buildUniqueStaffSlugs(staff: StaffSlugIdentity[]): Map<string, string> {
  const grouped = new Map<string, StaffSlugIdentity[]>();

  for (const row of staff) {
    const fromName = buildStaffSlug({
      title: row.title,
      firstName: row.firstName,
      middleName: row.middleName,
      lastName: row.lastName,
    });
    const emailLocalPart = row.institutionalEmail.split('@')[0] ?? '';
    const baseSlug = fromName || slugify(emailLocalPart) || 'staff';

    const existing = grouped.get(baseSlug);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(baseSlug, [row]);
    }
  }

  const slugByStaffId = new Map<string, string>();
  for (const [baseSlug, entries] of grouped.entries()) {
    const ordered = [...entries].sort((a, b) => a.id.localeCompare(b.id));
    ordered.forEach((row, index) => {
      const suffix = index === 0 ? '' : `-${index + 1}`;
      slugByStaffId.set(row.id, `${baseSlug}${suffix}`);
    });
  }

  return slugByStaffId;
}

function compareNullableStrings(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });
}

function inferLinks(url: string | null): {
  googleScholarUrl: string | null;
  orcidUrl: string | null;
} {
  if (!url) {
    return { googleScholarUrl: null, orcidUrl: null };
  }

  const lower = url.toLowerCase();
  return {
    googleScholarUrl: lower.includes('scholar.google') ? url : null,
    orcidUrl: lower.includes('orcid.org') ? url : null,
  };
}

export interface PublicAcademicFacultyParams {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: PublicPeopleSort;
  filters?: PublicPeopleFilters;
}

export interface PublicPeopleCardItem {
  staffId: string;
  title: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  academicRank: string | null;
  designation: string | null;
  institutionalEmail: string;
  profileImageUrl: string | null;
  primaryResearchGroup: { name: string; slug: string } | null;
  secondaryAffiliation: { name: string; acronym: string | null } | null;
  computedStaffSlug: string;
  staffStatus: StaffStatus;
  isInMemoriam: boolean;
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;
  isHod: boolean;
  rankSortValue: number;
}

export type PublicAcademicFacultyItem = PublicPeopleCardItem;

function buildCardItem(
  row: {
    id: string;
    title: string | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    academicRank: string | null;
    designation: string | null;
    institutionalEmail: string;
    profileImageUrl: string | null;
    staffStatus: StaffStatus;
    isInMemoriam: boolean;
    dateOfBirth: Date | null;
    dateOfDeath: Date | null;
    secondaryAffiliation: {
      name: string;
      acronym: string | null;
    } | null;
    researchMemberships: Array<{
      researchGroup: {
        name: string;
        slug: string;
      };
    }>;
  },
  computedSlugById: Map<string, string>,
  currentHodStaffId: string | null,
): PublicPeopleCardItem {
  const rankSortValue = getAcademicRankSortValue(row.academicRank);
  return {
    staffId: row.id,
    title: row.title,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    academicRank: row.academicRank,
    designation: row.designation,
    institutionalEmail: row.institutionalEmail,
    profileImageUrl: row.profileImageUrl,
    primaryResearchGroup: row.researchMemberships[0]
      ? {
          name: row.researchMemberships[0].researchGroup.name,
          slug: row.researchMemberships[0].researchGroup.slug,
        }
      : null,
    secondaryAffiliation: row.secondaryAffiliation
      ? {
          name: row.secondaryAffiliation.name,
          acronym: row.secondaryAffiliation.acronym,
        }
      : null,
    computedStaffSlug: computedSlugById.get(row.id) ?? 'staff',
    staffStatus: row.staffStatus,
    isInMemoriam: row.isInMemoriam,
    dateOfBirth: row.dateOfBirth,
    dateOfDeath: row.dateOfDeath,
    isHod: currentHodStaffId === row.id,
    rankSortValue,
  };
}

function sortAcademicFaculty(a: PublicPeopleCardItem, b: PublicPeopleCardItem): number {
  if (a.isHod !== b.isHod) return a.isHod ? -1 : 1;
  if (a.rankSortValue !== b.rankSortValue) return a.rankSortValue - b.rankSortValue;

  const lastNameCmp = compareNullableStrings(a.lastName, b.lastName);
  if (lastNameCmp !== 0) return lastNameCmp;

  const firstNameCmp = compareNullableStrings(a.firstName, b.firstName);
  if (firstNameCmp !== 0) return firstNameCmp;

  return a.staffId.localeCompare(b.staffId);
}

function sortByName(a: PublicPeopleCardItem, b: PublicPeopleCardItem): number {
  const lastNameCmp = compareNullableStrings(a.lastName, b.lastName);
  if (lastNameCmp !== 0) return lastNameCmp;

  const firstNameCmp = compareNullableStrings(a.firstName, b.firstName);
  if (firstNameCmp !== 0) return firstNameCmp;

  return a.staffId.localeCompare(b.staffId);
}

export async function listPublicAcademicFaculty({
  q,
  page = 1,
  pageSize = 9,
  sort = 'default',
  filters = {},
}: PublicAcademicFacultyParams = {}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 9;

  const query = q?.trim();
  const andFilters: Prisma.StaffWhereInput[] = [];

  if (query) {
    andFilters.push({
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { middleName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { institutionalEmail: { contains: query, mode: 'insensitive' } },
      ],
    });
  }
  if (filters.rank) {
    andFilters.push({ academicRank: filters.rank });
  }
  if (filters.researchGroupSlug) {
    andFilters.push({
      researchMemberships: {
        some: {
          leftAt: null,
          researchGroup: { deletedAt: null, slug: filters.researchGroupSlug },
        },
      },
    });
  }
  if (filters.secondaryAffiliationId) {
    andFilters.push({ secondaryAffiliationId: filters.secondaryAffiliationId });
  }
  if (filters.formerStaffType) {
    andFilters.push({ staffType: filters.formerStaffType });
  }
  if (filters.alpha) {
    andFilters.push({
      OR: [
        { lastName: { startsWith: filters.alpha, mode: 'insensitive' } },
        { firstName: { startsWith: filters.alpha, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.StaffWhereInput = {
    deletedAt: null,
    isPublicProfile: true,
    staffType: 'ACADEMIC',
    staffStatus: 'ACTIVE',
    isInMemoriam: false,
    AND: andFilters,
  };

  const [rows, activeHodTerm] = await Promise.all([
    prisma.staff.findMany({
      where,
      select: {
        id: true,
        title: true,
        firstName: true,
        middleName: true,
        lastName: true,
        academicRank: true,
        designation: true,
        institutionalEmail: true,
        profileImageUrl: true,
        staffStatus: true,
        isInMemoriam: true,
        dateOfBirth: true,
        dateOfDeath: true,
        secondaryAffiliation: {
          select: {
            name: true,
            acronym: true,
          },
        },
        researchMemberships: {
          where: {
            leftAt: null,
            researchGroup: {
              deletedAt: null,
            },
          },
          orderBy: [{ joinedAt: 'asc' }, { researchGroup: { name: 'asc' } }],
          take: 1,
          select: {
            researchGroup: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.leadershipTerm.findFirst({
      where: {
        role: 'HOD',
        endDate: null,
      },
      orderBy: { startDate: 'desc' },
      select: {
        staffId: true,
      },
    }),
  ]);

  const computedSlugById = buildUniqueStaffSlugs(rows);
  const currentHodStaffId = activeHodTerm?.staffId ?? null;

  const mapped = rows.map<PublicAcademicFacultyItem>((row) =>
    buildCardItem(row, computedSlugById, currentHodStaffId),
  );

  const sorted =
    sort === 'name-asc'
      ? mapped.sort(sortByName)
      : sort === 'name-desc'
        ? mapped.sort((a, b) => sortByName(b, a))
        : mapped.sort(sortAcademicFaculty);

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const items = sorted.slice(start, end);

  return {
    items,
    nextPage: end < sorted.length ? safePage + 1 : undefined,
  };
}

export async function listPublicPeopleByCategory(
  category: PublicPeopleCategory,
  { q, page = 1, pageSize = 9, sort = 'default', filters = {} }: PublicAcademicFacultyParams = {},
) {
  if (category === 'academic-faculty') {
    return listPublicAcademicFaculty({ q, page, pageSize, sort, filters });
  }

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 9;
  const query = q?.trim();
  const filter = CATEGORY_MAP[category];
  const isInMemoriamCategory = category === 'in-memoriam';
  const baseCategoryFilter = isInMemoriamCategory
    ? { OR: [{ staffStatus: 'IN_MEMORIAM' as const }, { isInMemoriam: true }] }
    : { ...filter };

  const andFilters: Prisma.StaffWhereInput[] = [baseCategoryFilter];
  if (query) {
    andFilters.push({
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { middleName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { institutionalEmail: { contains: query, mode: 'insensitive' } },
      ],
    });
  }
  if (filters.rank) {
    andFilters.push({ academicRank: filters.rank });
  }
  if (filters.researchGroupSlug) {
    andFilters.push({
      researchMemberships: {
        some: {
          leftAt: null,
          researchGroup: { deletedAt: null, slug: filters.researchGroupSlug },
        },
      },
    });
  }
  if (filters.secondaryAffiliationId) {
    andFilters.push({ secondaryAffiliationId: filters.secondaryAffiliationId });
  }
  if (filters.formerStaffType) {
    andFilters.push({ staffType: filters.formerStaffType });
  }
  if (filters.alpha) {
    andFilters.push({
      OR: [
        { lastName: { startsWith: filters.alpha, mode: 'insensitive' } },
        { firstName: { startsWith: filters.alpha, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.StaffWhereInput = {
    deletedAt: null,
    isPublicProfile: true,
    staffStatus: { not: FORMER_STATUS },
    AND: andFilters,
  };

  const rows = await prisma.staff.findMany({
    where,
    select: {
      id: true,
      title: true,
      firstName: true,
      middleName: true,
      lastName: true,
      academicRank: true,
      designation: true,
      institutionalEmail: true,
      profileImageUrl: true,
      staffStatus: true,
      isInMemoriam: true,
      dateOfBirth: true,
      dateOfDeath: true,
      secondaryAffiliation: {
        select: {
          name: true,
          acronym: true,
        },
      },
      researchMemberships: {
        where: {
          leftAt: null,
          researchGroup: {
            deletedAt: null,
          },
        },
        orderBy: [{ joinedAt: 'asc' }, { researchGroup: { name: 'asc' } }],
        take: 1,
        select: {
          researchGroup: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  const computedSlugById = buildUniqueStaffSlugs(rows);
  const mapped = rows.map<PublicPeopleCardItem>((row) =>
    buildCardItem(row, computedSlugById, null),
  );
  const sorted =
    sort === 'name-desc' ? mapped.sort((a, b) => sortByName(b, a)) : mapped.sort(sortByName);

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const items = sorted.slice(start, end);

  return {
    items,
    nextPage: end < sorted.length ? safePage + 1 : undefined,
  };
}

export async function getPublicPeopleFilterFacets(category: PublicPeopleCategory) {
  const filter = CATEGORY_MAP[category];
  const isInMemoriamCategory = category === 'in-memoriam';
  const baseCategoryFilter = isInMemoriamCategory
    ? { OR: [{ staffStatus: 'IN_MEMORIAM' as const }, { isInMemoriam: true }] }
    : { ...filter };

  const rows = await prisma.staff.findMany({
    where: {
      deletedAt: null,
      isPublicProfile: true,
      staffStatus: { not: FORMER_STATUS },
      AND: [baseCategoryFilter],
    },
    select: {
      academicRank: true,
      staffType: true,
      secondaryAffiliation: { select: { id: true, name: true } },
      researchMemberships: {
        where: {
          leftAt: null,
          researchGroup: { deletedAt: null },
        },
        select: {
          researchGroup: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const ranks = Array.from(
    new Set(rows.map((r) => r.academicRank?.trim()).filter((v): v is string => Boolean(v))),
  ).sort((a, b) => a.localeCompare(b));

  const groupsMap = new Map<string, string>();
  for (const row of rows) {
    for (const membership of row.researchMemberships) {
      groupsMap.set(membership.researchGroup.slug, membership.researchGroup.name);
    }
  }
  const researchGroups = Array.from(groupsMap.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const affiliationsMap = new Map<string, string>();
  for (const row of rows) {
    if (row.secondaryAffiliation?.id && row.secondaryAffiliation?.name) {
      affiliationsMap.set(row.secondaryAffiliation.id, row.secondaryAffiliation.name);
    }
  }
  const affiliations = Array.from(affiliationsMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const formerStaffTypes = Array.from(new Set(rows.map((r) => r.staffType))).sort((a, b) =>
    a.localeCompare(b),
  );

  return { ranks, researchGroups, affiliations, formerStaffTypes };
}

export interface PublicStaffProfile {
  id: string;
  computedStaffSlug: string;
  title: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  academicRank: string | null;
  designation: string | null;
  institutionalEmail: string;
  profileImageUrl: string | null;
  staffType: StaffType;
  staffStatus: StaffStatus;
  isInMemoriam: boolean;
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;
  bio: string | null;
  education: string | null;
  researchInterests: string | null;
  membershipOfProfessionalOrganizations: string | null;
  primaryResearchGroup: { id: string; name: string; slug: string } | null;
  secondaryAffiliation: { id: string; name: string; acronym: string | null } | null;
  googleScholarUrl: string | null;
  orcidUrl: string | null;
}

/** Full staff profile by staff name slug. */
export async function getPublicStaffBySlug(slug: string): Promise<PublicStaffProfile | null> {
  const resolved = await resolvePublicStaffSlug(slug);
  if (!resolved) {
    return null;
  }

  const staff = await prisma.staff.findFirst({
    where: {
      id: resolved.staffId,
      ...wherePublicVisibleStaff(),
    },
    select: {
      id: true,
      title: true,
      firstName: true,
      middleName: true,
      lastName: true,
      institutionalEmail: true,
      staffType: true,
      staffStatus: true,
      academicRank: true,
      designation: true,
      academicLinkUrl: true,
      bio: true,
      education: true,
      researchInterests: true,
      membershipOfProfessionalOrganizations: true,
      profileImageUrl: true,
      isInMemoriam: true,
      dateOfBirth: true,
      dateOfDeath: true,
      secondaryAffiliation: {
        select: {
          id: true,
          name: true,
          acronym: true,
        },
      },
      researchMemberships: {
        where: {
          leftAt: null,
          researchGroup: {
            deletedAt: null,
          },
        },
        orderBy: [{ joinedAt: 'asc' }, { researchGroup: { name: 'asc' } }],
        take: 1,
        select: {
          researchGroup: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!staff) {
    return null;
  }

  const links = inferLinks(staff.academicLinkUrl);

  return {
    id: staff.id,
    computedStaffSlug: resolved.computedSlug,
    title: staff.title,
    firstName: staff.firstName,
    middleName: staff.middleName,
    lastName: staff.lastName,
    academicRank: staff.academicRank,
    designation: staff.designation,
    institutionalEmail: staff.institutionalEmail,
    profileImageUrl: staff.profileImageUrl,
    staffType: staff.staffType,
    staffStatus: staff.staffStatus,
    isInMemoriam: staff.isInMemoriam,
    dateOfBirth: staff.dateOfBirth,
    dateOfDeath: staff.dateOfDeath,
    bio: staff.bio,
    education: staff.education,
    researchInterests: staff.researchInterests,
    membershipOfProfessionalOrganizations: staff.membershipOfProfessionalOrganizations,
    primaryResearchGroup: staff.researchMemberships[0]
      ? {
          id: staff.researchMemberships[0].researchGroup.id,
          name: staff.researchMemberships[0].researchGroup.name,
          slug: staff.researchMemberships[0].researchGroup.slug,
        }
      : null,
    secondaryAffiliation: staff.secondaryAffiliation,
    googleScholarUrl: links.googleScholarUrl,
    orcidUrl: links.orcidUrl,
  };
}

export interface PublicTabQueryParams {
  page?: number;
  pageSize?: number;
}

function normalizePaging({ page = 1, pageSize = 8 }: PublicTabQueryParams = {}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 8;
  const skip = (safePage - 1) * safePageSize;
  return { safePage, safePageSize, skip };
}

function parseAuthorsJson(value: unknown): AuthorObject[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is AuthorObject => {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      (typeof (entry as { given_name?: unknown }).given_name === 'string' ||
        typeof (entry as { family_name?: unknown }).family_name === 'string')
    );
  });
}

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase()}.`)
    .join(' ');
}

function formatSingleAuthorApa(author: AuthorObject): string {
  if (author.is_group) {
    const groupName = author.given_name?.trim() || author.family_name?.trim() || '';
    return groupName;
  }

  const family = author.family_name?.trim() || '';
  const initials = toInitials([author.given_name, author.middle_name].filter(Boolean).join(' '));
  return [family, initials].filter(Boolean).join(', ');
}

export async function listPublicResearchOutputsForStaff(
  staffId: string,
  params: PublicTabQueryParams = {},
) {
  const { safePage, safePageSize, skip } = normalizePaging(params);
  const where = { staffId, deletedAt: null };

  const [rows, total] = await Promise.all([
    prisma.researchOutput.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        authors: true,
        authorsJson: true,
        year: true,
        fullDate: true,
        venue: true,
        sourceTitle: true,
        publisher: true,
        metaJson: true,
        doi: true,
        url: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: safePageSize,
    }),
    prisma.researchOutput.count({ where }),
  ]);

  const authorStaffIds = Array.from(
    new Set(
      rows.flatMap((row) =>
        parseAuthorsJson(row.authorsJson).flatMap((author) =>
          typeof author.staffId === 'string' && author.staffId.trim() ? [author.staffId.trim()] : [],
        ),
      ),
    ),
  );
  const authorSlugById = await getPublicStaffSlugsByIds(authorStaffIds);

  const items = rows.map((row) => {
    const parsedAuthors = parseAuthorsJson(row.authorsJson);
    const authorsStructured = parsedAuthors
      .map((author) => ({
        label: formatSingleAuthorApa(author),
        staffSlug:
          typeof author.staffId === 'string'
            ? authorSlugById.get(author.staffId.trim()) || null
            : null,
      }))
      .filter((author) => author.label.trim().length > 0);

    return {
      ...row,
      authorsStructured,
    };
  });

  return {
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

export async function listPublicProjectsForStaff(
  staffId: string,
  params: PublicTabQueryParams = {},
) {
  const { safePage, safePageSize, skip } = normalizePaging(params);
  const where = { staffId, deletedAt: null };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        acronym: true,
        descriptionHtml: true,
        url: true,
        status: true,
        isFunded: true,
        startYear: true,
        endYear: true,
      },
      orderBy: [{ startYear: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: safePageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

export async function listPublicThesesForStaff(staffId: string, params: PublicTabQueryParams = {}) {
  const { safePage, safePageSize, skip } = normalizePaging(params);
  const where = { staffId, deletedAt: null };

  const [items, total] = await Promise.all([
    prisma.studentThesis.findMany({
      where,
      select: {
        id: true,
        title: true,
        studentName: true,
        registrationNumber: true,
        degreeLevel: true,
        programme: true,
        externalUrl: true,
        status: true,
        year: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: safePageSize,
    }),
    prisma.studentThesis.count({ where }),
  ]);

  return {
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

export async function listPublicTeachingForStaff(
  staffId: string,
  params: PublicTabQueryParams = {},
) {
  const { safePage, safePageSize, skip } = normalizePaging(params);
  const where = { staffId, deletedAt: null };

  const allItems = await prisma.teachingResponsibility.findMany({
    where,
    select: {
      id: true,
      courseCode: true,
      title: true,
      semester: true,
      sessionYear: true,
    },
    orderBy: [{ createdAt: 'desc' }],
  });
  const total = allItems.length;

  const courseCodes = Array.from(
    new Set(
      allItems
        .map((item) => item.courseCode?.trim())
        .filter((code): code is string => Boolean(code)),
    ),
  );

  const courses = courseCodes.length
    ? await prisma.course.findMany({
        where: {
          code: { in: courseCodes },
          deletedAt: null,
        },
        select: {
          code: true,
          title: true,
          description: true,
          prerequisites: true,
          L: true,
          T: true,
          P: true,
          U: true,
          semesterTaken: true,
          yearLevel: true,
          program: {
            select: {
              level: true,
              programmeCode: true,
            },
          },
        },
      })
    : [];

  const priorityByProgrammeCode = {
    PHY: 0,
    EPH: 1,
    SLT: 2,
  } as const;

  const courseMetaByCode = new Map(
    courses.map((course) => {
      const levelBase = course.program.level === 'POSTGRADUATE' ? 0 : 3;
      const programmePriority =
        priorityByProgrammeCode[
          course.program.programmeCode as keyof typeof priorityByProgrammeCode
        ] ?? 99;
      const levelProgrammePriority = levelBase + programmePriority;
      const yearPriority =
        course.program.level === 'UNDERGRADUATE' && typeof course.yearLevel === 'number'
          ? 5 - course.yearLevel
          : 99;
      return [
        course.code,
        {
          levelProgrammePriority,
          yearPriority,
        },
      ] as const;
    }),
  );

  const sortedItems = [...allItems].sort((left, right) => {
    const leftCode = left.courseCode?.trim() ?? '';
    const rightCode = right.courseCode?.trim() ?? '';
    const leftMeta = leftCode ? courseMetaByCode.get(leftCode) : null;
    const rightMeta = rightCode ? courseMetaByCode.get(rightCode) : null;

    const levelProgrammeDiff =
      (leftMeta?.levelProgrammePriority ?? 999) - (rightMeta?.levelProgrammePriority ?? 999);
    if (levelProgrammeDiff !== 0) return levelProgrammeDiff;

    const yearDiff = (leftMeta?.yearPriority ?? 999) - (rightMeta?.yearPriority ?? 999);
    if (yearDiff !== 0) return yearDiff;

    const sessionYearDiff = (right.sessionYear ?? -1) - (left.sessionYear ?? -1);
    if (sessionYearDiff !== 0) return sessionYearDiff;

    const codeDiff = leftCode.localeCompare(rightCode);
    if (codeDiff !== 0) return codeDiff;

    return left.id.localeCompare(right.id);
  });

  const courseHrefByCode = new Map(
    courses.map((course) => {
      const levelSegment = course.program.level === 'UNDERGRADUATE' ? 'undergraduate' : 'postgraduate';
      const programmeCode = course.program.programmeCode.toLowerCase();
      const href = `/academics/${levelSegment}/${programmeCode}?course=${encodeURIComponent(course.code)}#course-listing`;
      return [course.code, href];
    }),
  );
  const courseDetailsByCode = new Map(
    courses.map((course) => [
      course.code,
      {
        code: course.code,
        title: course.title,
        description: course.description,
        prerequisites: course.prerequisites,
        L: course.L,
        T: course.T,
        P: course.P,
        U: course.U,
        semesterTaken: course.semesterTaken,
      },
    ]),
  );

  const pagedItems = sortedItems.slice(skip, skip + safePageSize);

  return {
    items: pagedItems.map((item) => {
      const normalizedCourseCode = item.courseCode?.trim() || null;
      return {
        ...item,
        courseCode: normalizedCourseCode,
        publicCourseHref: normalizedCourseCode
          ? courseHrefByCode.get(normalizedCourseCode) ?? null
          : null,
        modalCourse: normalizedCourseCode
          ? courseDetailsByCode.get(normalizedCourseCode) ?? null
          : null,
      };
    }),
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

export async function getPublicTributesForStaff(
  staffId: string,
  params: PublicTabQueryParams = {},
) {
  const { safePage, safePageSize, skip } = normalizePaging(params);

  const [biography, items, total] = await Promise.all([
    prisma.departmentalTribute.findUnique({
      where: { staffId },
      select: {
        title: true,
        bodyHtml: true,
      },
    }),
    prisma.tributeTestimonial.findMany({
      where: {
        staffId,
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        relationship: true,
        tributeHtml: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
      skip,
      take: safePageSize,
    }),
    prisma.tributeTestimonial.count({
      where: {
        staffId,
        status: 'APPROVED',
      },
    }),
  ]);

  return {
    biography,
    items,
    page: safePage,
    nextPage: skip + safePageSize < total ? safePage + 1 : undefined,
    prevPage: safePage > 1 ? safePage - 1 : undefined,
  };
}

/** Current HOD info for public display. */
export async function getPublicCurrentHod() {
  const term = await prisma.leadershipTerm.findFirst({
    where: {
      role: 'HOD',
      endDate: null,
      staff: {
        deletedAt: null,
        isPublicProfile: true,
        staffStatus: { not: FORMER_STATUS, in: PUBLIC_VISIBLE_STAFF_STATUSES },
      },
    },
    select: {
      startDate: true,
      staff: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          academicRank: true,
          profileImageUrl: true,
          hodAddress: {
            select: { title: true, body: true },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  if (!term) return null;
  return { ...term.staff, startYear: term.startDate.getFullYear() };
}
