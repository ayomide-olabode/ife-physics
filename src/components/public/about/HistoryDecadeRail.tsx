interface DecadeRailProps {
  decades: string[];
}

export function HistoryDecadeRail({ decades }: DecadeRailProps) {
  return (
    <nav className="sticky top-24" aria-label="Decade navigation">
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-200" />

        <ul className="relative space-y-6">
          {decades.map((decade) => (
            <li key={decade}>
              <a href={`#decade-${decade}`} className="flex items-center gap-3 group">
                {/* Dot */}
                <span className="relative z-10 flex h-4 w-4 items-center justify-center bg-brand-navy border-2 border-brand-navy flex-shrink-0" />
                {/* Label */}
                <span className="text-base font-semibold text-brand-navy group-hover:text-brand-yellow transition-colors">
                  {decade}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
