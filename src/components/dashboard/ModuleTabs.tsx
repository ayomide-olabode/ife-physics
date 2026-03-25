'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface TabItem {
  label: string;
  href: string;
}

export function ModuleTabs({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();

  return (
    <div className="border-b mb-6">
      <div className="container mx-auto px-4 max-w-7xl">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-base font-medium ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
