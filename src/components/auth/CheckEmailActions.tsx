'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toastError, toastSuccess } from '@/lib/toast';

type ResendResult = {
  status: 'SENT' | 'THROTTLED';
  minutesRemaining?: number;
};

type CheckEmailActionsProps = {
  onResend: () => Promise<ResendResult>;
  backHref: string;
};

const DEFAULT_COOLDOWN_SECONDS = 5 * 60;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.max(totalSeconds % 60, 0)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function CheckEmailActions({ onResend, backHref }: CheckEmailActionsProps) {
  const [isSending, setIsSending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(DEFAULT_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleResend() {
    setIsSending(true);
    try {
      const result = await onResend();

      if (result.status === 'THROTTLED') {
        const remainingSeconds = Math.max((result.minutesRemaining ?? 1) * 60, 60);
        setCooldownSeconds(remainingSeconds);
        toastError(
          `Email already sent recently. Please wait ${result.minutesRemaining ?? 1} minute(s).`,
        );
        return;
      }

      setCooldownSeconds(DEFAULT_COOLDOWN_SECONDS);
      toastSuccess('Email link sent. Check your inbox.');
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to resend email right now.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <Button asChild variant="ghost" className="w-full rounded-none">
          <Link href={backHref}>Back</Link>
        </Button>

        <Button asChild variant="outline" className="w-full rounded-none">
          <Link href="https://mail.google.com" target="_blank" rel="noreferrer">
            Open email
          </Link>
        </Button>

        <Button
          type="button"
          onClick={handleResend}
          disabled={isSending || cooldownSeconds > 0}
          variant="outline"
          className="w-full rounded-none"
        >
          {isSending ? 'Sending...' : 'Resend email'}
        </Button>
      </div>

      {cooldownSeconds > 0 ? (
        <p className="text-sm text-muted-foreground text-right">
          Resend available in {formatCountdown(cooldownSeconds)}
        </p>
      ) : null}
    </div>
  );
}
