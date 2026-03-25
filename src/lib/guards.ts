import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  canAccessAcademicRoute,
  hasAnyAcademicAccessForLevel,
  isSuperAdmin,
  hasGlobalRole,
  isResearchLeadForGroup,
  getScopedResearchGroupIds,
  canEditStaff,
  hasTributesAccess,
  hasFullProfileTabAccessByStaffType,
} from '@/lib/rbac';
import { ProgrammeCode, ScopedRole } from '.prisma/client';
import { Session } from 'next-auth';

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireSuperAdmin(session: Session) {
  if (!isSuperAdmin(session)) {
    notFound();
  }
}

export async function requireGlobalRole(session: Session, role: ScopedRole) {
  const hasRole = await hasGlobalRole(session, role);
  if (!hasRole) {
    notFound();
  }
}

export async function requireResearchLeadForGroup(session: Session, groupId: string) {
  const isLead = await isResearchLeadForGroup(session, groupId);
  if (!isLead) {
    notFound();
  }
}

export async function requireAnyResearchLead(session: Session) {
  if (isSuperAdmin(session)) return;
  const groupIds = await getScopedResearchGroupIds(session);
  if (groupIds.length === 0) {
    notFound();
  }
}

export async function requireAcademicAccess({
  level,
  programmeCode,
}: {
  level: 'UNDERGRADUATE' | 'POSTGRADUATE';
  programmeCode: ProgrammeCode;
}) {
  const session = await requireAuth();
  const canAccess = await canAccessAcademicRoute(session, { level, programmeCode });
  if (!canAccess) {
    notFound();
  }
  return session;
}

export async function requireAnyAcademicLevelAccess(level: 'UNDERGRADUATE' | 'POSTGRADUATE') {
  const session = await requireAuth();
  const canAccess = await hasAnyAcademicAccessForLevel(session, level);
  if (!canAccess) {
    notFound();
  }
  return session;
}

export async function requireFullProfileTabAccess(sessionArg?: Session) {
  const session = sessionArg ?? (await requireAuth());
  const canAccess = hasFullProfileTabAccessByStaffType(session.user?.staffType);

  if (!canAccess) {
    redirect('/dashboard/profile/overview');
  }

  return session;
}

export function requireStaffOwnership(session: Session, staffId: string) {
  if (!canEditStaff(session, staffId)) {
    notFound();
  }
}

export async function requireTributesAccess() {
  const session = await requireAuth();
  const canAccess = await hasTributesAccess(session);
  if (!canAccess) {
    notFound();
  }
  return session;
}
