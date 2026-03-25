'use server';

import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/guards';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { StaffType, StaffStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requestRegistrationLink } from '@/server/actions/onboardingRegister';

export async function createStaff({
  institutionalEmail,
  staffType,
  designation,
  academicRank,
  isSuperAdminShell = false,
}: {
  institutionalEmail: string;
  staffType: StaffType;
  designation?: string;
  academicRank: string;
  isSuperAdminShell?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);
  const adminUserId = session.user.userId;

  const emailLower = institutionalEmail.toLowerCase().trim();
  const staffRank = academicRank.trim();

  if (!staffRank) {
    throw new Error('Staff rank is required.');
  }

  // Validate unique email
  const existingStaff = await prisma.staff.findUnique({
    where: { institutionalEmail: emailLower },
  });

  if (existingStaff) {
    throw new Error('A staff member with this institutional email already exists.');
  }

  // Transaction
  const result = await prisma.$transaction(async (tx) => {
    const newStaff = await tx.staff.create({
      data: {
        institutionalEmail: emailLower,
        staffType,
        staffStatus: StaffStatus.ACTIVE,
        designation: designation?.trim() || null,
        academicRank: staffRank,
      },
    });

    // Ensure a shell user always exists for onboarding.
    const existingUser = await tx.user.findUnique({
      where: { staffId: newStaff.id },
    });

    const newUser =
      existingUser ??
      (await tx.user.create({
        data: {
          staffId: newStaff.id,
          passwordHash: '',
          isSuperAdmin: isSuperAdminShell,
        },
      }));

    return {
      staffId: newStaff.id,
      userId: newUser?.id,
      institutionalEmail: newStaff.institutionalEmail,
      staffType: newStaff.staffType,
      staffStatus: newStaff.staffStatus,
      isSuperAdmin: newUser?.isSuperAdmin,
    };
  });

  await logAudit({
    actorId: adminUserId,
    action: 'STAFF_CREATED',
    entityType: 'Staff',
    entityId: result.staffId,
    snapshot: {
      email: result.institutionalEmail,
      type: result.staffType,
      status: result.staffStatus,
    },
  });

  if (result.userId) {
    await logAudit({
      actorId: adminUserId,
      action: 'USER_SHELL_CREATED',
      entityType: 'User',
      entityId: result.userId,
      snapshot: {
        staffId: result.staffId,
        isSuperAdmin: result.isSuperAdmin,
      },
    });
  }

  revalidatePath('/dashboard/admin/staff');
  revalidatePath('/dashboard/admin/users');

  const inviteResult = await requestRegistrationLink(result.institutionalEmail);

  return {
    ...result,
    inviteStatus: inviteResult.success ? inviteResult.status : 'NO_STAFF',
    inviteMinutesRemaining: inviteResult.success ? inviteResult.minutesRemaining : undefined,
    inviteError: inviteResult.success ? undefined : inviteResult.error,
  };
}

export async function updateStaffStatus({
  staffId,
  staffStatus,
}: {
  staffId: string;
  staffStatus: StaffStatus;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);

  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, staffStatus: true, isInMemoriam: true },
  });

  if (!existing) {
    throw new Error('Staff record not found.');
  }

  if (existing.staffStatus === staffStatus) {
    return { success: true, unchanged: true };
  }

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      staffStatus,
      isInMemoriam: staffStatus === StaffStatus.IN_MEMORIAM,
    },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'STAFF_STATUS_UPDATED',
    entityType: 'Staff',
    entityId: staffId,
    snapshot: {
      before: {
        staffStatus: existing.staffStatus,
        isInMemoriam: existing.isInMemoriam,
      },
      after: {
        staffStatus,
        isInMemoriam: staffStatus === StaffStatus.IN_MEMORIAM,
      },
    },
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath(`/dashboard/admin/staff/${staffId}`);
  revalidatePath('/people');

  return { success: true, unchanged: false };
}

export async function updateStaffPublicVisibility({
  staffId,
  isPublicProfile,
}: {
  staffId: string;
  isPublicProfile: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);

  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, isPublicProfile: true },
  });

  if (!existing) {
    throw new Error('Staff record not found.');
  }

  if (existing.isPublicProfile === isPublicProfile) {
    return { success: true, unchanged: true };
  }

  await prisma.staff.update({
    where: { id: staffId },
    data: { isPublicProfile },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'STAFF_PUBLIC_VISIBILITY_UPDATED',
    entityType: 'Staff',
    entityId: staffId,
    snapshot: {
      before: { isPublicProfile: existing.isPublicProfile },
      after: { isPublicProfile },
    },
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath(`/dashboard/admin/staff/${staffId}`);
  revalidatePath('/people');
  revalidatePath('/about/leadership');
  revalidatePath('/research');

  return { success: true, unchanged: false };
}

export async function deleteStaff({ staffId }: { staffId: string }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  await requireSuperAdmin(session);

  if (session.user.staffId === staffId) {
    throw new Error('You cannot delete your own staff record.');
  }

  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      institutionalEmail: true,
      user: {
        select: { id: true },
      },
    },
  });

  if (!existing) {
    throw new Error('Staff record not found.');
  }

  await prisma.staff.delete({
    where: { id: staffId },
  });

  await logAudit({
    actorId: session.user.userId,
    action: 'STAFF_DELETED',
    entityType: 'Staff',
    entityId: staffId,
    snapshot: {
      email: existing.institutionalEmail,
      hadUserAccount: Boolean(existing.user),
    },
  });

  revalidatePath('/dashboard/admin/staff');
  revalidatePath('/dashboard/admin/users');
  revalidatePath('/people');

  return { success: true };
}
