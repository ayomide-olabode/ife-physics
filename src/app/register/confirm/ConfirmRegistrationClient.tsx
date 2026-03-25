'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCardShell } from '@/components/auth/AuthCardShell';
import { STAFF_TYPE_OPTIONS } from '@/lib/options';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { PasswordStrength } from '@/components/forms/PasswordStrength';
import { Button } from '@/components/ui/button';
import { toastError } from '@/lib/toast';
import { completeRegistration } from '@/server/actions/onboardingRegister';
import { StaffType } from '@prisma/client';

type Props = {
  token: string;
};

export function ConfirmRegistrationClient({ token }: Props) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [staffType, setStaffType] = useState<StaffType | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthCardShell title="Registration link missing">
        <div className="space-y-4 text-center">
          <p className="text-base text-muted-foreground">
            We could not find a valid registration token in this link.
          </p>
          <Button asChild className="rounded-none">
            <Link href="/register">Back to register</Link>
          </Button>
        </div>
      </AuthCardShell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      if (!staffType) {
        toastError('Please select your staff type.');
        setIsSubmitting(false);
        return;
      }

      const result = await completeRegistration(token, staffType, password, confirmPassword);

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
    <AuthCardShell
      title="Email confirmed"
      subtitle="Create your password to finish account setup."
      footer={
        <p>
          Already set your password?{' '}
          <Link href="/login" className="font-medium text-brand-navy hover:underline">
            Login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="staffType" className="block text-base font-medium text-foreground">
            Staff Type
          </label>
          <select
            id="staffType"
            value={staffType}
            onChange={(e) => setStaffType(e.target.value as StaffType)}
            className="flex h-10 w-full rounded-none border border-input bg-white px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
            <option value="">Select your staff type</option>
            {STAFF_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-base font-medium text-foreground">
            Create Password
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

        <Button
          type="submit"
          className="w-full rounded-none"
          disabled={isSubmitting || !token || !staffType}
        >
          {isSubmitting ? 'Setting password...' : 'Set password'}
        </Button>
      </form>
    </AuthCardShell>
  );
}
