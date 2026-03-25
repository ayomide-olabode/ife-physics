import Link from 'next/link';

const PEOPLE_CATEGORIES = [
  { label: 'Academic Faculty', href: '/people/academic-faculty', key: 'academic-faculty' },
  { label: 'Visiting Faculty', href: '/people/visiting-faculty', key: 'visiting-faculty' },
  { label: 'Emeritus Faculty', href: '/people/emeritus-faculty', key: 'emeritus-faculty' },
  { label: 'Technical Staff', href: '/people/technical-staff', key: 'technical-staff' },
  { label: 'Support Staff', href: '/people/support-staff', key: 'support-staff' },
  { label: 'Retired Staff', href: '/people/retired-staff', key: 'retired-staff' },
  { label: 'In Memoriam', href: '/people/in-memoriam', key: 'in-memoriam' },
] as const;

export function PeopleCategorySidebar({ activeKey }: { activeKey: string }) {
  return (
    <aside className="border border-gray-200 bg-white h-fit">
      <nav aria-label="People categories" className="flex flex-col divide-y divide-gray-200">
        {PEOPLE_CATEGORIES.map((category) => {
          const isActive = category.key === activeKey;
          return (
            <Link
              key={category.key}
              href={category.href}
              className={[
                'px-5 py-4 text-base font-semibold transition-colors',
                isActive
                  ? 'bg-brand-navy text-brand-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-brand-navy',
              ].join(' ')}
            >
              {category.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
