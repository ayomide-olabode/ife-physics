'use client';

import { CheckEmailActions } from '@/components/auth/CheckEmailActions';
import { requestPasswordResetLink } from '@/server/actions/passwordReset';

type Props = {
  email: string;
};

export function ForgotPasswordCheckEmailClient({ email }: Props) {
  return (
    <CheckEmailActions
      backHref="/login"
      onResend={async () => {
        const result = await requestPasswordResetLink(email);

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
