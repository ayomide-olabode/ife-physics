import { listPublicRohYears } from '@/server/public/queries/rollOfHonourPublic';
import { PageHero } from '@/components/public/PageHero';
import { RollOfHonourYears } from '@/components/public/RollOfHonour/RollOfHonourYears';

export default async function RollOfHonourPage() {
  const years = await listPublicRohYears();
  const initialYears = years.slice(0, 5);
  const remainingYears = years.slice(5);

  return (
    <>
      <PageHero breadcrumbLabel="Our Department" title="Roll of Honour" />

      <div className="pb-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="mb-8 max-w-2xl text-white/90">
            Celebrating our top-performing graduates across all programmes.
          </p>

          <RollOfHonourYears initialYears={initialYears} remainingYears={remainingYears} />
        </div>
      </div>
    </>
  );
}
