import Link from 'next/link';

const programmes = [
  {
    title: 'Physics',
    code: 'phy',
    description: 'Explore the fundamental laws governing matter, energy, and the universe.',
    degrees: [
      { label: 'B.Sc.', href: '/academics/undergraduate/phy' },
      { label: 'M.Sc.', href: '/academics/postgraduate/phy' },
      { label: 'M.Phil.', href: '/academics/postgraduate/phy' },
      { label: 'Ph.D.', href: '/academics/postgraduate/phy' },
    ],
  },
  {
    title: 'Engineering Physics',
    code: 'eph',
    description: 'Bridge physics and engineering for innovative technological solutions.',
    degrees: [
      { label: 'B.Sc.', href: '/academics/undergraduate/eph' },
      { label: 'M.Sc.', href: '/academics/postgraduate/eph' },
      { label: 'M.Phil.', href: '/academics/postgraduate/eph' },
      { label: 'Ph.D.', href: '/academics/postgraduate/eph' },
    ],
  },
  {
    title: 'Science Laboratory Technology',
    code: 'slt',
    description:
      'Develop practical skills in scientific instrumentation and laboratory management.',
    degrees: [{ label: 'B.Sc.', href: '/academics/undergraduate/slt' }],
  },
];

export function ProgrammeCards() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-serif font-bold text-brand-navy mb-2">
          Our Academic Programmes
        </h2>
        <p className="text-gray-600 mb-10 max-w-2xl">
          We offer undergraduate and postgraduate programmes across three disciplines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {programmes.map((prog) => (
            <div key={prog.code} className="border border-gray-200 overflow-hidden group">
              {/* Placeholder image area */}
              <div className="h-48 bg-brand-navy/10 flex items-center justify-center">
                <span className="text-4xl font-serif font-bold text-brand-navy/30">
                  {prog.title}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-serif font-semibold text-brand-navy mb-2">
                  {prog.title}
                </h3>
                <p className="text-base text-gray-600 mb-4">{prog.description}</p>
                <div className="flex flex-wrap gap-2">
                  {prog.degrees.map((d) => (
                    <Link
                      key={d.label}
                      href={d.href}
                      className="text-sm font-medium text-brand-navy border border-brand-navy px-3 py-1 hover:bg-brand-navy hover:text-brand-white transition-colors"
                    >
                      {d.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
