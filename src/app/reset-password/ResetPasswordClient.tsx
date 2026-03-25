'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCardShell } from '@/components/auth/AuthCardShell';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { PasswordStrength } from '@/components/forms/PasswordStrength';
import { Button } from '@/components/ui/button';
import { toastError } from '@/lib/toast';
import { completePasswordReset } from '@/server/actions/passwordReset';

type Props = {
  token: string;
};

export function ResetPasswordClient({ token }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthCardShell title="Reset link missing">
        <div className="space-y-4 text-center">
          <p className="text-base text-muted-foreground">
            We could not find a valid reset token in this link.
          </p>
          <Button asChild className="rounded-none">
            <Link href="/forgot-password">Back to forgot password</Link>
          </Button>
        </div>
      </AuthCardShell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await completePasswordReset(token, password, confirmPassword);
      if (!result.success) {
        toastError(result.error ?? 'Link expired or invalid');
        setIsSubmitting(false);
        return;
      }

      router.push('/login?new=1');
    } catch {
      toastError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCardShell title="Set new password" subtitle="Create your new password to continue.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="password" className="block text-base font-medium text-foreground">
            New Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="[&>input]:rounded-none [&>input]:bg-white"
            required
            minLength={8}
          />
          <PasswordStrength password={password} />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-base font-medium text-foreground">
            Confirm Password
          </label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Retype password"
            className="[&>input]:rounded-none [&>input]:bg-white"
            required
            minLength={8}
          />
        </div>

        <Button type="submit" className="w-full rounded-none" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Set password'}
        </Button>
      </form>
    </AuthCardShell>
  );
}
