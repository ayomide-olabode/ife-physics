import 'server-only';

import { createHash, randomBytes } from 'crypto';
import type { EmailTokenType } from '@prisma/client';

const RESEND_COOLDOWN_MINUTES = 5;
const RESEND_COOLDOWN_MS = RESEND_COOLDOWN_MINUTES * 60 * 1000;

export function generateRawToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function getExpiryMinutes(type: EmailTokenType): number {
  switch (type) {
    case 'INVITE':
      return 60;
    case 'PASSWORD_RESET':
      return 30;
    default: {
      const _exhaustiveCheck: never = type;
      return _exhaustiveCheck;
    }
  }
}

export function getExpiresAt(type: EmailTokenType): Date {
  const expiresInMs = getExpiryMinutes(type) * 60 * 1000;
  return new Date(Date.now() + expiresInMs);
}

export function canResend(lastSentAt?: Date | null): boolean {
  if (!lastSentAt) return true;
  return Date.now() - lastSentAt.getTime() >= RESEND_COOLDOWN_MS;
}

export function minutesUntilResend(lastSentAt?: Date | null): number {
  if (!lastSentAt) return 0;

  const remainingMs = RESEND_COOLDOWN_MS - (Date.now() - lastSentAt.getTime());
  if (remainingMs <= 0) return 0;

  return Math.ceil(remainingMs / (60 * 1000));
}
