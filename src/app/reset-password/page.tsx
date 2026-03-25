import { ResetPasswordClient } from './ResetPasswordClient';

type Props = {
  searchParams?: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const token = params.token ?? '';

  return <ResetPasswordClient token={token} />;
}
