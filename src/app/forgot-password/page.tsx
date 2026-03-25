'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCardShell } from '@/components/auth/AuthCardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastError } from '@/lib/toast';
import { requestPasswordResetLink } from '@/server/actions/passwordReset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await requestPasswordResetLink(normalizedEmail);

      if (!result.success) {
        toastError(result.error ?? 'Unable to process your request right now.');
        setIsSubmitting(false);
        return;
      }

      router.push(`/forgot-password/check-email?email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      toastError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCardShell
      title="Reset Password"
      footer={
        <p>
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-brand-navy hover:underline">
            Back to login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-base font-medium text-foreground">
            Institutional Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="username@oauife.edu.ng"
            className="rounded-none bg-white"
            required
          />
        </div>

        <Button type="submit" className="w-full rounded-none" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Send reset link'}
        </Button>
      </form>
    </AuthCardShell>
  );
}
