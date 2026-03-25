'use server';

import prisma from '@/lib/prisma';
import { DegreeScope, ProgrammeScope, ScopedRole, ScopeType } from '@prisma/client';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function assignRole(params: {
  userId: string;
  role: ScopedRole;
  scopeId?: string | null;
  programmeScope?: ProgrammeScope | null;
  degreeScope?: DegreeScope | null;
  expiresAt?: Date | null;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId || !session.user.isSuperAdmin) {
    return { error: 'Unauthorized.' };
  }

  const { userId, role, scopeId, programmeScope, degreeScope, expiresAt } = params;

  // Validate user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, staffId: true },
  });
  if (!targetUser) {
    return { error: 'User not found.' };
  }

  const now = new Date();

  let scopeType: ScopeType;
  let finalScopeId: string | null = null;
  let finalGroupSlug: string | null = null;
  let finalProgrammeScope: ProgrammeScope | null = null;
  let finalDegreeScope: DegreeScope | null = null;
  let existingActiveLeadForScope = false;

  if (role === 'EDITOR') {
    scopeType = 'GLOBAL';
    if (programmeScope || degreeScope) {
      return { error: 'EDITOR cannot include programme or degree scope.' };
    }
  } else if (role === 'ACADEMIC_COORDINATOR') {
    scopeType = 'GLOBAL';
    if (!programmeScope || !degreeScope) {
      return {
        error: 'ACADEMIC_COORDINATOR requires both programmeScope and degreeScope.',
      };
    }
    if (scopeId) {
      return { error: 'ACADEMIC_COORDINATOR cannot include scopeId.' };
    }
    finalProgrammeScope = programmeScope;
    finalDegreeScope = degreeScope;
  } else if (role === 'RESEARCH_LEAD') {
    scopeType = 'RESEARCH_GROUP';
    if (programmeScope || degreeScope) {
      return { error: 'RESEARCH_LEAD cannot include programme or degree scope.' };
    }
    if (!scopeId) {
      return { error: 'RESEARCH_LEAD requires a scopeId (Research Group).' };
    }

    // Verify ResearchGroup exists
    const group = await prisma.researchGroup.findUnique({
      where: { id: scopeId },
      select: { id: true, slug: true, deletedAt: true },
    });
    if (!group || group.deletedAt) {
      return { error: 'Specified Research Group does not exist.' };
    }
    finalScopeId = scopeId;
    finalGroupSlug = group.slug;

    // Enforce max 2 active RESEARCH_LEAD per group
    const existingLeadForScope = await prisma.roleAssignment.findFirst({
      where: {
        userId,
        role: 'RESEARCH_LEAD',
        scopeType: 'RESEARCH_GROUP',
        scopeId: finalScopeId,
      },
      select: {
        deletedAt: true,
        expiresAt: true,
      },
    });
    existingActiveLeadForScope = Boolean(
      existingLeadForScope &&
        existingLeadForScope.deletedAt === null &&
        (existingLeadForScope.expiresAt === null || existingLeadForScope.expiresAt > now),
    );

    if (!existingActiveLeadForScope) {
      // Enforce max 2 active RESEARCH_LEAD per group (only when activating a new lead)
      const activeLeadsCount = await prisma.roleAssignment.count({
        where: {
          role: 'RESEARCH_LEAD',
          scopeType: 'RESEARCH_GROUP',
          scopeId: finalScopeId,
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      });

      if (activeLeadsCount >= 2) {
        return { error: 'Maximum of 2 active Research Leads allowed per group.' };
      }
    }
  } else {
    return { error: 'Invalid role specified.' };
  }

  try {
    const assignment = await prisma.$transaction(async (tx) => {
      const existingAssignment = await tx.roleAssignment.findFirst({
        where: {
          userId,
          role,
          scopeType,
          scopeId: finalScopeId,
          ...(role === 'ACADEMIC_COORDINATOR'
            ? {
                programmeScope: finalProgrammeScope,
                degreeScope: finalDegreeScope,
              }
            : {}),
        },
        orderBy: [{ deletedAt: 'asc' }, { updatedAt: 'desc' }],
      });

      const createdAssignment = existingAssignment
        ? await tx.roleAssignment.update({
            where: { id: existingAssignment.id },
            data: {
              deletedAt: null,
              programmeScope: finalProgrammeScope,
              degreeScope: finalDegreeScope,
              expiresAt: expiresAt ?? null,
            },
          })
        : await tx.roleAssignment.create({
            data: {
              userId,
              role,
              scopeType,
              scopeId: finalScopeId,
              programmeScope: finalProgrammeScope,
              degreeScope: finalDegreeScope,
              expiresAt: expiresAt ?? null,
            },
          });

      if (role === 'RESEARCH_LEAD' && finalScopeId) {
        // Keep staff's primary research-group membership aligned with their lead group.
        await tx.researchGroupMembership.deleteMany({
          where: {
            staffId: targetUser.staffId,
            researchGroupId: { not: finalScopeId },
          },
        });

        await tx.staffFocusAreaSelection.deleteMany({
          where: {
            staffId: targetUser.staffId,
            focusArea: {
              researchGroupId: { not: finalScopeId },
            },
          },
        });

        await tx.researchGroupMembership.upsert({
          where: {
            staffId_researchGroupId: {
              staffId: targetUser.staffId,
              researchGroupId: finalScopeId,
            },
          },
          update: {
            leftAt: null,
            joinedAt: new Date(),
          },
          create: {
            staffId: targetUser.staffId,
            researchGroupId: finalScopeId,
            joinedAt: new Date(),
            leftAt: null,
          },
        });
      }

      return createdAssignment;
    });

    const snapshot = JSON.parse(JSON.stringify(assignment));

    await logAudit({
      actorId: session.user.userId,
      action: 'ROLE_ASSIGNED',
      entityType: 'RoleAssignment',
      entityId: assignment.id,
      snapshot,
    });

    if (role === 'RESEARCH_LEAD') {
      revalidatePath('/dashboard/profile/overview');
      if (finalScopeId) {
        revalidatePath(`/dashboard/research/groups/${finalScopeId}`);
      }
      if (finalGroupSlug) {
        revalidatePath(`/research/${finalGroupSlug}`);
      }
      // @ts-expect-error Next Canary Type definition bug
      revalidateTag('research-groups');
      // @ts-expect-error Next Canary Type definition bug
      revalidateTag('public:research-groups');
    }

    return { success: true, roleAssignment: assignment };
  } catch (error: unknown) {
    // Check for unique constraint violation
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { error: 'User already has this role for the specified scope.' };
    }
    console.error('Error assigning role:', error);
    return { error: 'Failed to assign role.' };
  }
}

export async function revokeRole({ roleAssignmentId }: { roleAssignmentId: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId || !session.user.isSuperAdmin) {
    return { error: 'Unauthorized.' };
  }

  const existing = await prisma.roleAssignment.findUnique({
    where: { id: roleAssignmentId },
  });

  if (!existing) {
    return { error: 'Role assignment not found.' };
  }

  if (existing.deletedAt) {
    return { error: 'Role assignment is already revoked.' };
  }

  try {
    const updated = await prisma.roleAssignment.update({
      where: { id: roleAssignmentId },
      data: { deletedAt: new Date() },
    });

    const snapshot = JSON.parse(JSON.stringify(updated));

    await logAudit({
      actorId: session.user.userId,
      action: 'ROLE_REVOKED',
      entityType: 'RoleAssignment',
      entityId: updated.id,
      snapshot,
    });

    return { success: true, roleAssignment: updated };
  } catch (error) {
    console.error('Error revoking role:', error);
    return { error: 'Failed to revoke role.' };
  }
}
