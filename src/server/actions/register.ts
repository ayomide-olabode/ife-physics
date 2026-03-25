'use server';

import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function completeRegistration({
  email,
  password,
}: {
  email: string;
  password?: string;
}) {
  if (!email) {
    return { error: 'Email address is required.' };
  }
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        institutionalEmail: {
          equals: email
        },
      },
    });

    if (!staff) {
      return {
        error: 'The email address provided is not associated with an invited staff record.',
      };
    }

    const user = await prisma.user.findUnique({
      where: { staffId: staff.id },
    });

    if (!user) {
      return { error: 'No user account has been provisioned for this email address yet.' };
    }

    if (user.passwordHash !== '') {
      return { error: 'This account has already been registered. Please sign in instead.' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await logAudit({
      actorId: user.id, // self-registration action
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      snapshot: {
        userId: user.id,
        staffId: user.staffId,
        registeredAt: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Error completing registration:', err);
    return { error: 'An unexpected error occurred while processing registration.' };
  }
}
