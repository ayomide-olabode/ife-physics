interface TimelineEntry {
  id: string;
  date: Date;
  title: string;
  shortDesc: string;
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative border-l-2 border-brand-navy/20 ml-4 space-y-10">
      {entries.map((entry) => (
        <li key={entry.id} className="ml-8">
          {/* Dot */}
          <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center bg-brand-yellow border-2 border-brand-navy" />

          {/* Date */}
          <time className="block text-sm font-semibold uppercase tracking-wider text-brand-yellow mb-1">
            {new Date(entry.date).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })}
          </time>

          {/* Title */}
          <h3 className="text-lg font-semibold text-brand-navy">{entry.title}</h3>

          {/* Description */}
          <p className="mt-1 text-base text-gray-600 leading-relaxed">{entry.shortDesc}</p>
        </li>
      ))}
    </ol>
  );
}
