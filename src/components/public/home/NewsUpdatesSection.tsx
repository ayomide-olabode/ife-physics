import Link from 'next/link';
import { NewsCard, type PublicNewsCardItem } from '@/components/public/news/NewsCard';

export function NewsUpdatesSection({ items }: { items: PublicNewsCardItem[] }) {
  return (
    <section className="py-20 bg-brand-navy">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-serif font-bold text-brand-white">News Updates</h2>
          <Link
            href="/news"
            className="text-base font-semibold text-brand-white border border-brand-white px-5 py-2 hover:bg-brand-white hover:text-brand-navy transition-colors"
          >
            VIEW ALL
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-white/60 text-center py-10">No news updates yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
