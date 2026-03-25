/** Shared skeleton placeholder for public loading states. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12">
      {/* Heading placeholder */}
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />

      {/* Text line placeholders */}
      <div className="space-y-3 mb-10">
        <div className="h-4 w-full max-w-xl bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-full max-w-lg bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-full max-w-md bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Card placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-gray-100 p-6 space-y-3">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact skeleton for detail / slug pages. */
export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12">
      {/* Image placeholder */}
      <div className="h-56 sm:h-72 bg-gray-200 rounded-lg animate-pulse mb-8" />

      {/* Heading */}
      <div className="h-8 w-80 bg-gray-200 rounded animate-pulse mb-4" />

      {/* Body text */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
