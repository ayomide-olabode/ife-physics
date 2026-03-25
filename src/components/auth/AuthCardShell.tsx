import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface AuthCardShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCardShell({ title, subtitle, children, footer }: AuthCardShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col items-center justify-center py-8">
        <Image
          src="/assets/logoPrimary.svg"
          alt="Department of Physics and Engineering Physics"
          width={360}
          height={64}
          className="mb-8 h-auto w-full max-w-[260px]"
          priority
        />

        <section className="w-full rounded-none border border-gray-200 bg-white p-8 shadow-sm">
          <header>
            <h1 className="text-center font-serif text-3xl text-brand-navy">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-center text-base text-muted-foreground">{subtitle}</p>
            ) : null}
          </header>

          <div className="mt-6">{children}</div>

          {footer ? (
            <footer className="mt-6 text-center text-base text-muted-foreground">{footer}</footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}
