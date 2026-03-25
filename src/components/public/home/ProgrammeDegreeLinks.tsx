import Link from 'next/link';

interface DegreeLink {
  label: string;
  href: string;
}

interface ProgrammeDegreeLinksProps {
  degrees: DegreeLink[];
}

export function ProgrammeDegreeLinks({ degrees }: ProgrammeDegreeLinksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {degrees.map((d) => (
        <Link
          key={`${d.label}-${d.href}`}
          href={d.href}
          className="text-sm font-medium text-brand-navy border border-brand-navy px-3 py-1 hover:bg-brand-navy hover:text-brand-white transition-colors"
        >
          {d.label}
        </Link>
      ))}
    </div>
  );
}
