'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
}

interface SectionSidebarProps {
  items: SidebarItem[];
  title?: string;
}

export function SectionSidebar({ items, title = 'Table of content' }: SectionSidebarProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const ratiosRef = useRef<Record<string, number>>({});

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (!itemIds.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          ratiosRef.current[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }

        let nextActive = itemIds[0] ?? '';
        let highestRatio = -1;

        for (const id of itemIds) {
          const ratio = ratiosRef.current[id] ?? 0;
          if (ratio > highestRatio) {
            highestRatio = ratio;
            nextActive = id;
          }
        }

        if (highestRatio > 0) {
          setActiveId((previous) => (previous === nextActive ? previous : nextActive));
          history.replaceState(null, '', `#${nextActive}`);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -60% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const id of itemIds) {
      const section = document.getElementById(id);
      if (section) {
        observer.observe(section);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [itemIds]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    setActiveId(id);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav
      className="sticky top-[120px] max-h-[calc(100vh-8rem)] overflow-y-auto border border-black/10 bg-white"
      aria-label={title}
    >
      <div className="border-b border-black/10 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      </div>

      <ul className="space-y-1 p-2">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => handleClick(event, item.id)}
                className={cn(
                  'block w-full px-3 py-2 text-left text-base font-semibold transition-colors duration-200 ',
                  isActive
                    ? 'bg-brand-navy text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-brand-navy',
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
