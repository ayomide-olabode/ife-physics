'use client';

import { cn } from '@/lib/utils';

type PasswordStrengthProps = {
  password: string;
};

function getStrengthScore(password: string): number {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(score, 5);
}

function getStrengthMeta(score: number): { label: string; color: string } {
  if (score <= 1) return { label: 'Very weak', color: 'bg-red-500' };
  if (score === 2) return { label: 'Weak', color: 'bg-orange-500' };
  if (score === 3) return { label: 'Fair', color: 'bg-yellow-500' };
  if (score === 4) return { label: 'Good', color: 'bg-sky-500' };
  return { label: 'Strong', color: 'bg-emerald-600' };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = getStrengthScore(password);
  const { label, color } = getStrengthMeta(score);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className={cn('h-1.5 rounded-none bg-muted', idx < score ? color : 'bg-muted')}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Password strength: {password ? label : 'None'}
      </p>
    </div>
  );
}
