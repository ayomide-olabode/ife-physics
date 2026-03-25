'use client';

import { CheckEmailActions } from '@/components/auth/CheckEmailActions';
import { requestRegistrationLink } from '@/server/actions/onboardingRegister';

type Props = {
  email: string;
};

export function RegisterCheckEmailClient({ email }: Props) {
  return (
    <CheckEmailActions
      backHref="/register"
      onResend={async () => {
        const result = await requestRegistrationLink(email);

        if (!result.success) {
          throw new Error(result.error ?? 'Unable to resend email right now.');
        }

        if (result.status === 'THROTTLED') {
          return {
            status: 'THROTTLED' as const,
            minutesRemaining: result.minutesRemaining,
          };
        }

        return { status: 'SENT' as const };
      }}
    />
  );
}
