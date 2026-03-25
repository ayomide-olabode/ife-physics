import { listPublicHistoryEntries } from '@/server/public/queries/historyPublic';
import { PageHero } from '@/components/public/PageHero';
import { HistoryTimeline, type DecadeGroup } from '@/components/public/history/HistoryTimeline';

type HistoryEntryDTO = {
  id: string;
  year: number;
  decade: string;
  title: string;
  shortDescription: string;
};

function groupByDecade(entries: HistoryEntryDTO[]): DecadeGroup[] {
  const map = new Map<string, HistoryEntryDTO[]>();

  for (const entry of entries) {
    if (!map.has(entry.decade)) map.set(entry.decade, []);
    map.get(entry.decade)!.push(entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
    .map(([decadeLabel, entriesInDecade]) => ({
      decadeLabel,
      decadeKey: decadeLabel,
      entriesFlat: [...entriesInDecade].sort((a, b) => a.year - b.year),
    }));
}

export default async function HistoryPage() {
  const rawEntries = await listPublicHistoryEntries();
  const entries: HistoryEntryDTO[] = rawEntries.map((entry) => {
    const year = entry.year;
    const decade = `${Math.floor(year / 10) * 10}s`;

    return {
      id: entry.id,
      year,
      decade,
      title: entry.title,
      shortDescription: entry.shortDesc,
    };
  });
  const decades = groupByDecade(entries);
  const allEntries = [...entries].sort((a, b) => a.year - b.year);

  return (
    <>
      <PageHero breadcrumbLabel="Our Department" title="Our History" />

      <div className="py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600 mb-12 max-w-2xl">
            A timeline of key milestones in the Department of Physics and Engineering Physics.
          </p>

          {entries.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                No history entries published yet. Check back soon.
              </p>
            </div>
          ) : (
            <HistoryTimeline decades={decades} allEntries={allEntries} />
          )}
        </div>
      </div>
    </>
  );
}
