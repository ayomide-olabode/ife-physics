'use client';

/** Shared public error boundary component. */
export function PublicErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h2 className="text-2xl font-serif font-semibold mb-3">Something went wrong</h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We couldn&apos;t load this page. Please check your connection and try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-brand-navy text-brand-white px-6 py-2.5 rounded font-medium text-base hover:bg-brand-navy/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
