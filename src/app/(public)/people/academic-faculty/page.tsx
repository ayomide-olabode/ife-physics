import { PeopleCategoryPage } from '@/components/public/PeopleCategoryPage';

export default async function AcademicFacultyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <PeopleCategoryPage
      title="Academic Faculty"
      category="academic-faculty"
      searchParams={await searchParams}
    />
  );
}
