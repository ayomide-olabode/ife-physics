'use server';

import bcrypt from 'bcrypt';
import { EmailTokenType } from '@prisma/client';
import { z } from 'zod';
import { buildResetEmail } from '@/lib/emailTemplates';
import { sendMail } from '@/lib/mailer';
import prisma from '@/lib/prisma';
import {
  canResend,
  generateRawToken,
  getExpiresAt,
  getExpiryMinutes,
  hashToken,
  minutesUntilResend,
} from '@/lib/tokens';

const emailSchema = z.string().email();

const completeSchema = z
  .object({
    tokenRaw: z.string().min(1, 'Invalid reset link.'),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string().min(8, 'Confirm password is required.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

function getAppUrl(): string {
  const baseUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  return baseUrl.replace(/\/+$/, '');
}

export async function requestPasswordResetLink(email: string) {
  const parsed = emailSchema.safeParse(email.trim().toLowerCase());
  if (!parsed.success) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const normalizedEmail = parsed.data;

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        institutionalEmail: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        institutionalEmail: true,
        user: {
          select: {
            id: true,
            passwordHash: true,
          },
        },
      },
    });

    if (!staff || !staff.user || staff.user.passwordHash === '') {
      return { success: true, status: 'SENT' as const };
    }

    const latestUnusedReset = await prisma.emailToken.findFirst({
      where: {
        type: EmailTokenType.PASSWORD_RESET,
        email: normalizedEmail,
        usedAt: null,
      },
      select: { lastSentAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (latestUnusedReset?.lastSentAt && !canResend(latestUnusedReset.lastSentAt)) {
      return {
        success: true,
        status: 'THROTTLED' as const,
        minutesRemaining: minutesUntilResend(latestUnusedReset.lastSentAt),
      };
    }

    const rawToken = generateRawToken();
    const tokenType = EmailTokenType.PASSWORD_RESET;
    const expiresMinutes = getExpiryMinutes(tokenType);

    await prisma.emailToken.create({
      data: {
        type: tokenType,
        email: normalizedEmail,
        userId: staff.user.id,
        staffId: staff.id,
        tokenHash: hashToken(rawToken),
        expiresAt: getExpiresAt(tokenType),
        usedAt: null,
        lastSentAt: new Date(),
      },
    });

    const link = `${getAppUrl()}/reset-password?token=${rawToken}`;
    const template = buildResetEmail({ link, expiresMinutes });

    await sendMail({
      to: normalizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    return { success: true, status: 'SENT' as const };
  } catch (error) {
    console.error('requestPasswordResetLink error:', error);
    return { success: false, error: 'Unable to process password reset request right now.' };
  }
}

export async function completePasswordReset(
  tokenRaw: string,
  password: string,
  confirmPassword: string,
) {
  const parsed = completeSchema.safeParse({ tokenRaw, password, confirmPassword });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid password reset data.',
    };
  }

  try {
    const now = new Date();
    const tokenHash = hashToken(parsed.data.tokenRaw);

    const resetToken = await prisma.emailToken.findFirst({
      where: {
        tokenHash,
        type: EmailTokenType.PASSWORD_RESET,
        usedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        userId: true,
        email: true,
      },
    });

    if (!resetToken?.userId) {
      return { success: false, error: 'Link expired or invalid' };
    }

    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || user.passwordHash === '') {
      return { success: false, error: 'Link expired or invalid' };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          lastLoginAt: null,
        },
      }),
      prisma.emailToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('completePasswordReset error:', error);
    return { success: false, error: 'Unable to reset password right now.' };
  }
}
