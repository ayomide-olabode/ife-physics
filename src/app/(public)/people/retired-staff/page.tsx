import { PeopleCategoryPage } from '@/components/public/PeopleCategoryPage';

export default async function RetiredStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <PeopleCategoryPage
      title="Retired Staff"
      category="retired-staff"
      searchParams={await searchParams}
    />
  );
}
