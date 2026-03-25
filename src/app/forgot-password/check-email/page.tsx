import { AuthCardShell } from '@/components/auth/AuthCardShell';
import { ForgotPasswordCheckEmailClient } from './ForgotPasswordCheckEmailClient';

type Props = {
  searchParams?: Promise<{ email?: string }>;
};

export default async function ForgotPasswordCheckEmailPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const email = params.email ?? 'your address';

  return (
    <AuthCardShell title="Check your mail">
      <div className="space-y-6 text-center">
        <p className="text-base text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{email}</span>, we
          sent a link.
        </p>

        <ForgotPasswordCheckEmailClient email={email} />
      </div>
    </AuthCardShell>
  );
}
