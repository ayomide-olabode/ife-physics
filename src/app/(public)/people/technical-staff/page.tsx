import { PeopleCategoryPage } from '@/components/public/PeopleCategoryPage';

export default async function TechnicalStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <PeopleCategoryPage
      title="Technical Staff"
      category="technical-staff"
      searchParams={await searchParams}
    />
  );
}
