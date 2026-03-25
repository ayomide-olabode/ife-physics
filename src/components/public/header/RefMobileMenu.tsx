'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { buildRefNavItems } from '@/components/public/header/RefNavbar';

function MobileNavGroup({
  item,
  pathname,
  onClose,
}: {
  item: { name: string; href?: string; dropdown?: { name: string; href: string }[] };
  pathname: string;
  onClose: () => void;
}) {
  const isActive =
    (item.href === '/' && pathname === '/') ||
    (item.href && item.href !== '/' && pathname.startsWith(item.href)) ||
    (item.dropdown && item.dropdown.some((d) => pathname === d.href));
  const [expanded, setExpanded] = useState(!!isActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center justify-between py-3 text-lg font-bold border-b border-white/10 transition-colors',
          isActive ? 'text-brand-yellow' : 'text-brand-white hover:text-brand-yellow',
        )}
      >
        <span>{item.name}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 opacity-50 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && item.dropdown && (
        <div className="bg-white/5 py-1">
          {item.dropdown.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClose}
              className={cn(
                'block pl-6 pr-4 py-2.5 text-base transition-colors',
                pathname === child.href
                  ? 'text-brand-yellow'
                  : 'text-white/70 hover:text-brand-yellow',
              )}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

type ResearchGroupNavItem = {
  name: string;
  abbreviation: string;
  slug: string;
};

export function RefMobileMenu({ researchGroups }: { researchGroups: ResearchGroupNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const refNavItems = buildRefNavItems(researchGroups);

  const utilityLinks = [
    { name: 'ePortal', href: 'https://eportal.oauife.edu.ng' },
    { name: 'NetQue', href: 'https://netque.oauife.edu.ng' },
    { name: 'PEPSA', href: '/under-construction' },
    { name: 'Our Alumni', href: '/under-construction' },
  ];

  return (
    <div className="md:hidden bg-white p-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/assets/logoPrimary.svg"
          alt="Department of Physics and Engineering Physics"
          width={360}
          height={64}
          className="w-auto h-10"
        />
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="text-brand-navy p-2">
            <Menu className="w-8 h-8" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[80vw] border-brand-navy bg-brand-navy p-6 [&>button]:text-brand-white [&>button]:opacity-100"
        >
          <SheetTitle className="text-brand-white text-left mb-6">Menu</SheetTitle>
          <div className="flex flex-col h-full overflow-y-auto pb-20">
            {/* Main Links */}
            <nav className="flex flex-col gap-0 mb-8">
              {refNavItems.map((link) => {
                if (link.dropdown) {
                  return (
                    <MobileNavGroup
                      key={link.name}
                      item={link}
                      pathname={pathname}
                      onClose={close}
                    />
                  );
                }

                const isActive =
                  (link.href === '/' && pathname === '/') ||
                  (link.href && link.href !== '/' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.name}
                    href={link.href || '/under-construction'}
                    onClick={close}
                    className={cn(
                      'text-lg font-bold py-3 border-b border-white/10 transition-colors',
                      isActive ? 'text-brand-yellow' : 'text-brand-white hover:text-brand-yellow',
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Utility Links */}
            <nav className="flex flex-col gap-4 mt-auto">
              <div className="text-brand-yellow text-sm font-bold uppercase tracking-wider mb-2">
                Quick Links
              </div>
              {utilityLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-base text-white/70 hover:text-brand-yellow transition-colors"
                >
                  {link.name}
                </Link>
              ))}

              <Link
                href="/under-construction"
                onClick={close}
                className="mt-4 px-6 py-3 bg-brand-yellow text-brand-navy text-center font-bold hover:bg-yellow-500 transition-colors"
              >
                Give to Physics
              </Link>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
