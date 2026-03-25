import Link from 'next/link';
import { SearchMonthYearFilterBar } from '@/components/public/filters/SearchMonthYearFilterBar';
import { NewsCard } from '@/components/public/news/NewsCard';
import { listPublicNews, listPublicNewsMonthGroups } from '@/server/public/queries/newsPublic';

function readParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildNewsHref(page: number, q?: string, month?: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (month) params.set('month', month);
  params.set('page', String(page));
  return `/news?${params.toString()}`;
}

export default async function NewsPage(props: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[]; month?: string | string[] }>;
}) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(readParam(searchParams.page)) || 1);
  const q = (readParam(searchParams.q) || '').trim();
  const month = (readParam(searchParams.month) || '').trim();
  const pageSize = 9;

  const [{ items, totalPages }, monthGroups] = await Promise.all([
    listPublicNews({ page, pageSize, q, month }),
    listPublicNewsMonthGroups(),
  ]);

  return (
    <div className="py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-4xl font-serif font-bold text-brand-navy mb-3">News</h1>
        <p className="text-gray-600 mb-10 max-w-2xl">
          Stay up to date with the latest news and announcements from the Department of Physics and
          Engineering Physics.
        </p>

        <SearchMonthYearFilterBar
          initialQuery={q}
          initialMonth={month}
          monthGroups={monthGroups}
          searchPlaceholder="Search news by title or content..."
        />

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {q || month
                ? 'No news articles match your current search/filter.'
                : 'No news articles published yet. Check back soon.'}
            </p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-4 mt-12"
                aria-label="News pagination"
              >
                {page > 1 && (
                  <Link
                    href={buildNewsHref(page - 1, q, month)}
                    className="text-base font-semibold text-brand-navy border border-brand-navy px-5 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-base text-gray-500">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildNewsHref(page + 1, q, month)}
                    className="text-base font-semibold text-brand-navy border border-brand-navy px-5 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
