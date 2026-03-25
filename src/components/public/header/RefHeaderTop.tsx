import Link from 'next/link';
import Image from 'next/image';
import { UserRound } from 'lucide-react';

const utilityLinks = [
  { name: 'ePortal', href: 'https://eportal.oauife.edu.ng' },
  { name: 'NetQue', href: 'https://netque.oauife.edu.ng' },
  { name: 'PEPSA', href: '/under-construction' },
  { name: 'Our Alumni', href: '/under-construction' },
];

export function RefHeaderTop() {
  return (
    <div className="bg-white border-b border-gray-100 hidden md:block">
      <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/logoPrimary.svg"
              alt="Department of Physics and Engineering Physics"
              width={360}
              height={64}
              className="w-auto h-[60px]"
              priority
            />
          </div>
        </Link>

        {/* Right: Utility Links + CTA */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6">
            {utilityLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-brand-navy text-base font-bold hover:text-brand-yellow transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <Link
            href="/under-construction"
            className="px-6 py-2 bg-brand-yellow text-brand-navy text-base font-bold hover:bg-yellow-500 transition-colors"
          >
            Give to Physics
          </Link>

          <div className="h-10 w-px bg-brand-navy/30" aria-hidden="true" />
          <Link
            href="/login"
            aria-label="User account"
            className="inline-flex items-center justify-center text-brand-navy hover:text-brand-yellow transition-colors"
          >
            <UserRound className="h-7 w-7" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </div>
  );
}
