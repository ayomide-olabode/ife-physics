'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type NavItem = {
  name: string;
  href?: string;
  dropdown?: { name: string; href: string }[];
};

type ResearchGroupNavItem = {
  name: string;
  abbreviation: string;
  slug: string;
};

const baseRefNavItems: NavItem[] = [
  { name: 'HOME', href: '/' },
  {
    name: 'OUR DEPARTMENT',
    href: '',
    dropdown: [
      { name: 'Our History', href: '/about/history' },
      { name: 'Our Leadership', href: '/about/leadership' },
      { name: 'Roll of Honour', href: '/about/roll-of-honour' },
    ],
  },
  {
    name: 'ACADEMICS',
    href: '',
    dropdown: [
      { name: 'Undergraduate', href: '/academics/undergraduate' },
      { name: 'Postgraduate', href: '/academics/postgraduate' },
    ],
  },
  { name: 'RESEARCH', href: '' },
  {
    name: 'PEOPLE',
    href: '',
    dropdown: [
      { name: 'Academic Faculty', href: '/people/academic-faculty' },
      { name: 'Visiting Faculty', href: '/people/visiting-faculty' },
      { name: 'Emeritus Faculty', href: '/people/emeritus-faculty' },
      { name: 'Technical Staff', href: '/people/technical-staff' },
      { name: 'Support Staff', href: '/people/support-staff' },
      { name: 'Retired Staff', href: '/people/retired-staff' },
      { name: 'In Memoriam', href: '/people/in-memoriam' },
    ],
  },
  { name: 'RESOURCES', href: '/resources' },
];

export function buildRefNavItems(researchGroups: ResearchGroupNavItem[]): NavItem[] {
  return baseRefNavItems.map((item) => {
    if (item.name !== 'RESEARCH') {
      return item;
    }

    const dropdown = researchGroups.map((group) => ({
      name: `${group.name}`,
      href: `/research/${group.slug}`,
    }));

    return {
      ...item,
      dropdown: dropdown.length > 0 ? dropdown : undefined,
    };
  });
}

export function RefNavbar({ researchGroups }: { researchGroups: ResearchGroupNavItem[] }) {
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const refNavItems = buildRefNavItems(researchGroups);

  return (
    <div className="bg-brand-navy z-50 text-brand-white shadow-md hidden md:block">
      <div className="max-w-[1440px] mx-auto px-8 relative">
        <nav className="flex items-center justify-between">
          <ul className="flex items-center justify-between w-full">
            {refNavItems.map((link) => {
              const isActive =
                (link.href === '/' && pathname === '/') ||
                (link.href !== '/' &&
                  link.href &&
                  (pathname === link.href || pathname.startsWith(link.href + '/'))) ||
                (link.dropdown && link.dropdown.some((d) => pathname === d.href));
              const hasDropdown = !!link.dropdown;
              const isOpen = activeDropdown === link.name;

              return (
                <li
                  key={link.name}
                  className="flex-1 text-center relative group"
                  onMouseEnter={() => setActiveDropdown(link.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {link.href ? (
                    <Link
                      href={link.href}
                      className={cn(
                        'relative w-full py-6 text-base font-bold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-1',
                        'hover:text-brand-yellow bg-transparent text-brand-white',
                        "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-brand-yellow after:origin-center after:scale-x-0 after:transition-transform after:duration-200 hover:after:scale-x-100",
                        isActive && !isOpen && 'text-brand-yellow',
                        isOpen && 'text-brand-white',
                      )}
                    >
                      {link.name}
                      {hasDropdown && <ChevronDown className="w-4 h-4" />}
                    </Link>
                  ) : (
                    <button
                      onClick={() => setActiveDropdown(isOpen ? null : link.name)}
                      className={cn(
                        'relative w-full py-6 text-base font-bold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-1 cursor-pointer',
                        'hover:text-brand-yellow bg-transparent text-brand-white',
                        "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-brand-yellow after:origin-center after:scale-x-0 after:transition-transform after:duration-200 hover:after:scale-x-100",
                        isActive && !isOpen && 'text-brand-yellow',
                        isOpen && 'text-brand-white',
                      )}
                    >
                      {link.name}
                      {hasDropdown && <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {hasDropdown && (
                    <div
                      className={cn(
                        'absolute top-full left-0 w-full min-w-[220px] bg-white text-left shadow-xl  transform transition-all duration-200 origin-top z-50',
                        isOpen
                          ? 'opacity-100 scale-y-100 visible'
                          : 'opacity-0 scale-y-95 invisible',
                      )}
                      style={{
                        left: '50%',
                        transform: isOpen
                          ? 'translateX(-50%) scaleY(1)'
                          : 'translateX(-50%) scaleY(0.95)',
                      }}
                    >
                      <ul className="py-2">
                        {link.dropdown?.map((dropItem) => (
                          <li key={dropItem.href}>
                            <Link
                              href={dropItem.href}
                              className="block px-4 py-3 text-base font-semibold text-brand-navy hover:bg-gray-100 hover:text-brand-yellow transition-colors whitespace-nowrap text-center"
                            >
                              {dropItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
