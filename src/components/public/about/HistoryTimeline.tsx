interface HistoryEntry {
  id: string;
  date: Date;
  title: string;
  shortDesc: string;
}

interface DecadeGroup {
  decade: string;
  years: {
    year: number;
    entries: HistoryEntry[];
  }[];
}

export function groupByDecade(entries: HistoryEntry[]): DecadeGroup[] {
  const map = new Map<string, Map<number, HistoryEntry[]>>();

  for (const entry of entries) {
    const year = new Date(entry.date).getFullYear();
    const decade = `${Math.floor(year / 10) * 10}s`;

    if (!map.has(decade)) map.set(decade, new Map());
    const yearMap = map.get(decade)!;
    if (!yearMap.has(year)) yearMap.set(year, []);
    yearMap.get(year)!.push(entry);
  }

  // Sort decades ascending, years ascending within each
  return Array.from(map.entries())
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([decade, yearMap]) => ({
      decade,
      years: Array.from(yearMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, entries]) => ({ year, entries })),
    }));
}

export function HistoryTimeline({ groups }: { groups: DecadeGroup[] }) {
  return (
    <div className="space-y-16">
      {groups.map((group) => (
        <section key={group.decade} id={`decade-${group.decade}`} className="scroll-mt-24">
          {/* Decade heading */}
          <h2 className="text-2xl font-serif font-bold text-brand-navy mb-8 border-b-2 border-brand-yellow pb-2 inline-block">
            {group.decade}
          </h2>

          <div className="space-y-10">
            {group.years.map(({ year, entries }) => (
              <div key={year}>
                {/* Year pill */}
                <div className="mb-4">
                  <span className="inline-block bg-brand-navy text-white text-base font-semibold px-4 py-1.5">
                    {year}
                  </span>
                </div>

                {/* Cards for this year */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entries.map((entry) => (
                    <article
                      key={entry.id}
                      className="bg-white border border-gray-200 shadow-sm p-6"
                    >
                      <time className="block text-sm font-semibold uppercase tracking-wider text-brand-yellow mb-2">
                        {new Date(entry.date).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </time>
                      <h3 className="text-lg font-semibold text-brand-navy leading-snug">
                        {entry.title}
                      </h3>
                      <p className="mt-2 text-base text-gray-600 leading-relaxed">
                        {entry.shortDesc}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
