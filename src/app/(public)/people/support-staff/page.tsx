import { PeopleCategoryPage } from '@/components/public/PeopleCategoryPage';

export default async function SupportStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <PeopleCategoryPage
      title="Support Staff"
      category="support-staff"
      searchParams={await searchParams}
    />
  );
}
