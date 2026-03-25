import { ResearchOutputsCarousel } from './ResearchOutputsCarousel';
import type { RecentResearchOutputItem } from '@/server/public/queries/recentResearchOutputs';

export function ResearchOutputsSection({ items }: { items: RecentResearchOutputItem[] }) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <>
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-3xl font-serif font-bold text-brand-navy">Research Outputs</h2>
            </div>
            <p className="py-10 text-center text-gray-500">No research outputs yet. Check back soon.</p>
          </>
        ) : (
          <ResearchOutputsCarousel items={items} />
        )}
      </div>
    </section>
  );
}
