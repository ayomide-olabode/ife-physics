import { AuthCardShell } from '@/components/auth/AuthCardShell';
import { RegisterCheckEmailClient } from './RegisterCheckEmailClient';

type Props = {
  searchParams?: Promise<{ email?: string }>;
};

export default async function CheckEmailPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const email = params.email ?? 'your address';

  return (
    <AuthCardShell title="Check your Email">
      <div className="space-y-6 text-center">
        <p className="text-base text-muted-foreground">
          We just sent a link to you at <span className="font-medium text-foreground">{email}</span>
          .
        </p>

        <RegisterCheckEmailClient email={email} />
      </div>
    </AuthCardShell>
  );
}
