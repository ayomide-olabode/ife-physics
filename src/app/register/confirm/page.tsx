import { ConfirmRegistrationClient } from './ConfirmRegistrationClient';

type Props = {
  searchParams?: Promise<{ token?: string }>;
};

export default async function ConfirmRegistrationPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const token = params.token ?? '';

  return <ConfirmRegistrationClient token={token} />;
}
