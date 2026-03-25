import 'server-only';

import prisma from '@/lib/prisma';
import { StaffStatus } from '@prisma/client';

type CoordinatorType = 'GENERAL_POSTGRADUATE' | 'GENERAL_UNDERGRADUATE' | 'GENERAL_SLT';
const PUBLIC_VISIBLE_STAFF_STATUSES: StaffStatus[] = ['ACTIVE', 'RETIRED', 'IN_MEMORIAM'];
const FORMER_STATUS: StaffStatus = 'FORMER';

async function findCoordinatorByType(type: CoordinatorType) {
  const now = new Date();
  const whereByType =
    type === 'GENERAL_POSTGRADUATE'
      ? { programmeScope: 'GENERAL' as const, degreeScope: 'POSTGRADUATE' as const }
      : type === 'GENERAL_UNDERGRADUATE'
        ? { programmeScope: 'GENERAL' as const, degreeScope: 'UNDERGRADUATE' as const }
        : { programmeScope: 'SLT' as const, degreeScope: 'GENERAL' as const };

  const assignment = await prisma.roleAssignment.findFirst({
    where: {
      role: 'ACADEMIC_COORDINATOR',
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...whereByType,
    },
    select: {
      id: true,
      programmeScope: true,
      degreeScope: true,
      expiresAt: true,
      createdAt: true,
      user: {
        select: {
              staff: {
                select: {
                  id: true,
                  isPublicProfile: true,
                  staffStatus: true,
                  isInMemoriam: true,
                  title: true,
              firstName: true,
              middleName: true,
              lastName: true,
              profileImageUrl: true,
              institutionalEmail: true,
              designation: true,
            },
          },
        },
      },
    },
    // Prefer active indefinite records; then latest assignment.
    orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
  });

  if (!assignment?.user.staff || !assignment.programmeScope || !assignment.degreeScope) {
    return null;
  }
  const staffIsPublic =
    assignment.user.staff.isPublicProfile &&
    assignment.user.staff.staffStatus !== FORMER_STATUS &&
    (PUBLIC_VISIBLE_STAFF_STATUSES.includes(assignment.user.staff.staffStatus) ||
      assignment.user.staff.isInMemoriam);
  if (!staffIsPublic) {
    return null;
  }

  return {
    id: assignment.id,
    coordinatorType: type,
    staff: {
      id: assignment.user.staff.id,
      title: assignment.user.staff.title,
      firstName: assignment.user.staff.firstName,
      middleName: assignment.user.staff.middleName,
      lastName: assignment.user.staff.lastName,
      institutionalEmail: assignment.user.staff.institutionalEmail,
      designation: assignment.user.staff.designation,
      profileImageUrl: assignment.user.staff.profileImageUrl,
    },
    programmeScope: assignment.programmeScope,
    degreeScope: assignment.degreeScope,
  };
}

/** Returns only the 3 public coordinator slots required by leadership page rules. */
export async function getPublicAcademicCoordinatorsTop3() {
  const [pgGeneral, ugGeneral, sltGeneral] = await Promise.all([
    findCoordinatorByType('GENERAL_POSTGRADUATE'),
    findCoordinatorByType('GENERAL_UNDERGRADUATE'),
    findCoordinatorByType('GENERAL_SLT'),
  ]);

  return [pgGeneral, ugGeneral, sltGeneral].filter((item) => item !== null).slice(0, 3);
}

/** Past HOD terms (endDate is NOT null). */
export async function listPublicPastHods() {
  const terms = await prisma.leadershipTerm.findMany({
    where: {
      role: 'HOD',
      endDate: { not: null },
      staff: {
        isPublicProfile: true,
        staffStatus: { not: FORMER_STATUS, in: PUBLIC_VISIBLE_STAFF_STATUSES },
      },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      staff: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          profileImageUrl: true,
          hodAddress: {
            select: { title: true, body: true },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  return terms;
}

/** Leadership payload for /about/leadership public page. */
export async function getPublicLeadership() {
  const [currentHodTerm, academicCoordinators, pastHodTerms] = await Promise.all([
    prisma.leadershipTerm.findFirst({
      where: {
        role: 'HOD',
        endDate: null,
        staff: {
          isPublicProfile: true,
          staffStatus: { not: FORMER_STATUS, in: PUBLIC_VISIBLE_STAFF_STATUSES },
        },
      },
      select: {
        startDate: true,
        staff: {
          select: {
            title: true,
            firstName: true,
            middleName: true,
            lastName: true,
            academicRank: true,
            profileImageUrl: true,
            hodAddress: {
              select: {
                title: true,
                body: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    }),
    getPublicAcademicCoordinatorsTop3(),
    prisma.leadershipTerm.findMany({
      where: {
        role: 'HOD',
        endDate: { not: null },
        staff: {
          isPublicProfile: true,
          staffStatus: { not: FORMER_STATUS, in: PUBLIC_VISIBLE_STAFF_STATUSES },
        },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        staff: {
          select: {
            id: true,
            title: true,
            firstName: true,
            middleName: true,
            lastName: true,
            profileImageUrl: true,
            designation: true,
            academicRank: true,
            hodAddress: {
              select: {
                title: true,
                body: true,
              },
            },
          },
        },
      },
      orderBy: { endDate: 'desc' },
    }),
  ]);

  const currentHod = currentHodTerm
    ? { ...currentHodTerm.staff, startYear: currentHodTerm.startDate.getFullYear() }
    : null;

  const pastHods = pastHodTerms.map((term) => ({
    id: term.id,
    startYear: term.startDate.getFullYear(),
    endYear: term.endDate ? term.endDate.getFullYear() : null,
    staff: {
      id: term.staff.id,
      title: term.staff.title,
      firstName: term.staff.firstName,
      middleName: term.staff.middleName,
      lastName: term.staff.lastName,
      profileImageUrl: term.staff.profileImageUrl,
      designation: term.staff.designation,
      academicRank: term.staff.academicRank,
    },
    address: term.staff.hodAddress
      ? { title: term.staff.hodAddress.title, body: term.staff.hodAddress.body }
      : null,
    hasHodAddress: Boolean(term.staff.hodAddress?.body?.trim()),
  }));

  return {
    currentHod,
    academicCoordinators,
    pastHods,
  };
}
