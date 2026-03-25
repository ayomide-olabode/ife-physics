import { LoginPageClient } from './LoginPageClient';

type Props = {
  searchParams?: Promise<{ new?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const isNewAccount = params.new === '1';

  return <LoginPageClient isNewAccount={isNewAccount} />;
}
