import Image from 'next/image';
import Link from 'next/link';

export function UnderConstructionPlaceholder() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-4xl text-center">
        <div className="mx-auto w-fit">
          <Image
            src="/assets/logoPrimary.svg"
            alt="Department of Physics and Engineering Physics"
            width={260}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>

        <h1 className="mt-8 text-5xl font-bold tracking-tight text-black ">
          Quantum Superposition
        </h1>
        <p className="mt-2 text-xl text-gray-600">Here and There</p>

        <p className="mt-7 text-lg font-semibold text-orange-600">🚧 Under Construction</p>

        <p className="mx-auto mt-7 max-w-2xl text-base text-slate-600 text-balance">
          This page is currently in a state of flux. It exists in our plans, but has not yet
          collapsed into its final form.
        </p>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-navy pr-6 pl-5 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-navy/95"
          >
            <span aria-hidden="true">←</span>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
