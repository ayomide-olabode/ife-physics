import prisma from '@/lib/prisma';
import {
  DegreeScope,
  LeadershipRole,
  ProgrammeCode,
  ProgrammeScope,
  ScopedRole,
  ScopeType,
  StaffType,
} from '.prisma/client';
import { Session } from 'next-auth';

export type Role = ScopedRole;
export type AcademicLevel = 'UNDERGRADUATE' | 'POSTGRADUATE';

const PROGRAMME_PRIORITY: ProgrammeCode[] = [
  ProgrammeCode.PHY,
  ProgrammeCode.EPH,
  ProgrammeCode.SLT,
];
const FULL_PROFILE_TAB_STAFF_TYPES: StaffType[] = ['ACADEMIC', 'VISITING', 'EMERITUS'];

export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.isSuperAdmin === true;
}

export function hasFullProfileTabAccessByStaffType(staffType: StaffType | undefined): boolean {
  return staffType ? FULL_PROFILE_TAB_STAFF_TYPES.includes(staffType) : false;
}

export async function isCurrentHod(session: Session | null): Promise<boolean> {
  if (!session?.user?.staffId) return false;
  if (isSuperAdmin(session)) return true;

  const now = new Date();

  const activeHodTerm = await prisma.leadershipTerm.findFirst({
    where: {
      staffId: session.user.staffId,
      role: LeadershipRole.HOD,
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    select: { id: true },
  });

  return !!activeHodTerm;
}

async function getActiveAcademicCoordinatorScopes(
  session: Session | null,
): Promise<Array<{ programmeScope: ProgrammeScope | null; degreeScope: DegreeScope | null }>> {
  if (!session?.user?.userId) return [];

  const now = new Date();

  return prisma.roleAssignment.findMany({
    where: {
      userId: session.user.userId,
      role: ScopedRole.ACADEMIC_COORDINATOR,
      scopeType: ScopeType.GLOBAL,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: {
      programmeScope: true,
      degreeScope: true,
    },
  });
}

function coordinatorScopeMatches(
  assignment: { programmeScope: ProgrammeScope | null; degreeScope: DegreeScope | null },
  level: AcademicLevel,
  programmeCode: ProgrammeCode,
): boolean {
  if (!assignment.programmeScope || !assignment.degreeScope) return false;

  const programmeMatch =
    assignment.programmeScope === ProgrammeScope.GENERAL ||
    assignment.programmeScope === programmeCode;
  const degreeMatch =
    assignment.degreeScope === DegreeScope.GENERAL ||
    (assignment.degreeScope === DegreeScope.UNDERGRADUATE && level === 'UNDERGRADUATE') ||
    (assignment.degreeScope === DegreeScope.POSTGRADUATE && level === 'POSTGRADUATE');

  return programmeMatch && degreeMatch;
}

export async function canAccessAcademicRoute(
  session: Session | null,
  {
    level,
    programmeCode,
  }: {
    level: AcademicLevel;
    programmeCode: ProgrammeCode;
  },
): Promise<boolean> {
  if (!session?.user?.userId) return false;
  if (isSuperAdmin(session)) return true;
  if (await isCurrentHod(session)) return true;

  const assignments = await getActiveAcademicCoordinatorScopes(session);
  return assignments.some((assignment) =>
    coordinatorScopeMatches(assignment, level, programmeCode),
  );
}

export async function getAccessibleProgrammesForLevel(
  session: Session | null,
  level: AcademicLevel,
): Promise<ProgrammeCode[]> {
  if (!session?.user?.userId) return [];
  if (isSuperAdmin(session)) return PROGRAMME_PRIORITY;
  if (await isCurrentHod(session)) return PROGRAMME_PRIORITY;

  const assignments = await getActiveAcademicCoordinatorScopes(session);
  return PROGRAMME_PRIORITY.filter((programmeCode) =>
    assignments.some((assignment) => coordinatorScopeMatches(assignment, level, programmeCode)),
  );
}

export async function hasAnyAcademicAccessForLevel(
  session: Session | null,
  level: AcademicLevel,
): Promise<boolean> {
  const programmes = await getAccessibleProgrammesForLevel(session, level);
  return programmes.length > 0;
}

export async function hasGlobalRole(session: Session | null, role: ScopedRole): Promise<boolean> {
  if (!session?.user?.userId) return false;
  if (isSuperAdmin(session)) return true;
  if (role === ScopedRole.ACADEMIC_COORDINATOR && (await isCurrentHod(session))) return true;

  const now = new Date();

  const assignment = await prisma.roleAssignment.findFirst({
    where: {
      userId: session.user.userId,
      role: role,
      scopeType: ScopeType.GLOBAL,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });

  return !!assignment;
}

export async function hasTributesAccess(session: Session | null): Promise<boolean> {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;
  if (await hasGlobalRole(session, ScopedRole.EDITOR)) return true;
  return isCurrentHod(session);
}

export async function getScopedResearchGroupIds(session: Session | null): Promise<string[]> {
  if (!session?.user?.userId) return [];

  const now = new Date();

  const assignments = await prisma.roleAssignment.findMany({
    where: {
      userId: session.user.userId,
      role: ScopedRole.RESEARCH_LEAD,
      scopeType: ScopeType.RESEARCH_GROUP,
      scopeId: { not: null },
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { scopeId: true },
  });

  return assignments
    .map((a: { scopeId: string | null }) => a.scopeId)
    .filter((id): id is string => id !== null);
}

export async function isResearchLeadForGroup(
  session: Session | null,
  researchGroupId: string,
): Promise<boolean> {
  if (!session?.user?.userId) return false;
  if (isSuperAdmin(session)) return true;

  const now = new Date();

  const assignment = await prisma.roleAssignment.findFirst({
    where: {
      userId: session.user.userId,
      role: ScopedRole.RESEARCH_LEAD,
      scopeType: ScopeType.RESEARCH_GROUP,
      scopeId: researchGroupId,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });

  return !!assignment;
}

export function canEditStaff(session: Session | null, staffId: string): boolean {
  if (!session?.user) return false;
  return isSuperAdmin(session) || session.user.staffId === staffId;
}
