import Image from 'next/image';
import { ProgrammeDegreeLinks } from '@/components/public/home/ProgrammeDegreeLinks';

const programmes = [
  {
    title: 'Physics',
    code: 'phy',
    image: '/assets/physics.png',
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
    image: '/assets/engPhysics.png',
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
    image: '/assets/slt.jpg',
    degrees: [{ label: 'B.Sc.', href: '/academics/undergraduate/slt' }],
  },
];

export function AcademicProgrammesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-12">
          Our Academic Programmes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {programmes.map((prog) => (
            <div key={prog.code} className="bg-white overflow-hidden flex flex-col h-full group">
              {/* Programme image */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={prog.image}
                  alt={prog.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Card body */}
              <div className="flex flex-col grow space-y-2 pt-4 bg-gray-100 p-4">
                <h3 className="text-2xl font-semibold text-brand-navy group-hover:text-brand-yellow transition-colors duration-300">
                  {prog.title}
                </h3>

                {/* Degree-link buttons */}
                <div className="mt-auto border-t border-gray-300 pt-4">
                  <ProgrammeDegreeLinks degrees={prog.degrees} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
