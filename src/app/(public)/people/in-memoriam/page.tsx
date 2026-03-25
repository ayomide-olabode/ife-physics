import { PeopleCategoryPage } from '@/components/public/PeopleCategoryPage';

export default async function InMemoriamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <PeopleCategoryPage
      title="In Memoriam"
      category="in-memoriam"
      searchParams={await searchParams}
    />
  );
}
