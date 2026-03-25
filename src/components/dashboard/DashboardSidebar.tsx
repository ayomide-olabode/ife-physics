'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LogOut } from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === item.href || pathname.startsWith(item.href + '/');
  return (
    <Link
      href={item.href}
      className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {item.label}
    </Link>
  );
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const isGroupActive = pathname.startsWith(item.href);
  const isOpen = true;

  return (
    <div className="flex flex-col gap-1">
      <button
        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium transition-colors ${
          isGroupActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <span>{item.label}</span>
      </button>

      {isOpen && item.children && (
        <div className="ml-4 flex flex-col gap-1 border-l pl-2">
          {item.children.map((child) => {
            const isChildActive = pathname.startsWith(child.href.replace('/overview', ''));
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`block rounded-md border border-transparent px-3 py-1.5 text-base transition-colors ${
                  isChildActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex sticky top-16 h-[calc(100vh-4rem)] self-start flex-col w-64 shrink-0 py-6 pr-6 border-r">
      <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
        {items.map((item) =>
          item.children?.length ? (
            <NavGroup key={item.href} item={item} pathname={pathname} />
          ) : (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ),
        )}
      </nav>
      <div className="mt-auto pt-6 flex flex-col gap-2">
        <LogoutButton
          variant="outline"
          className="w-full justify-start border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </LogoutButton>
      </div>
    </aside>
  );
}

export function MobileSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <nav className="flex-1 flex flex-col gap-1 mt-6">
          {items.map((item) => (
            <div key={item.href} onClick={() => setOpen(false)}>
              {item.children?.length ? (
                <NavGroup item={item} pathname={pathname} />
              ) : (
                <NavLink item={item} pathname={pathname} />
              )}
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-6 flex flex-col gap-2">
          <LogoutButton
            variant="outline"
            className="w-full justify-start border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </LogoutButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
