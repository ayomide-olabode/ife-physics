import { PeopleCategoryPage } from '@/components/public/PeopleCategoryPage';

export default async function VisitingFacultyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <PeopleCategoryPage
      title="Visiting Faculty"
      category="visiting-faculty"
      searchParams={await searchParams}
    />
  );
}
