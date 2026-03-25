import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  /** Extra search params to preserve (e.g. { programme: 'PHY' }). */
  extraParams?: Record<string, string>;
}

function buildHref(basePath: string, page: number, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ page, totalPages, basePath, extraParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-4 mt-12" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={buildHref(basePath, page - 1, extraParams)}
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
          href={buildHref(basePath, page + 1, extraParams)}
          className="text-base font-semibold text-brand-navy border border-brand-navy px-5 py-2 hover:bg-brand-navy hover:text-brand-white transition-colors"
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
