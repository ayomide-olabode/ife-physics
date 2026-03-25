import { redirect } from 'next/navigation';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const params = await searchParams;
  const onboardingQuery = params.onboarding === '1' ? '?onboarding=1' : '';
  redirect(`/dashboard/profile/overview${onboardingQuery}`);
}
