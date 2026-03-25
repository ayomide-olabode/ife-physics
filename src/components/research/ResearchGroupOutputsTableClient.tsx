'use client';

import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';

type ResearchOutputRow = {
  id: string;
  outputType: string;
  title: string;
  authorsDisplay: string;
  year: number | null;
  doi: string | null;
};

export function ResearchGroupOutputsTableClient({
  items,
}: {
  items: ResearchOutputRow[];
}) {
  const rows = items.map((item) => [
    <span key={`type-${item.id}`} className="text-sm font-semibold uppercase tracking-wide">
      {item.outputType.replace(/_/g, ' ')}
    </span>,
    <span key={`title-${item.id}`} className="font-medium line-clamp-1">
      {item.title}
    </span>,
    <span key={`authors-${item.id}`} className="text-base text-muted-foreground line-clamp-1">
      {item.authorsDisplay}
    </span>,
    <span key={`year-${item.id}`} className="text-base tabular-nums">
      {item.year ?? '—'}
    </span>,
    item.doi ? (
      <a
        key={`doi-${item.id}`}
        href={`https://doi.org/${item.doi}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-sm text-blue-600 hover:underline line-clamp-1"
      >
        {item.doi}
      </a>
    ) : (
      <span key={`doi-${item.id}`} className="text-base text-muted-foreground">
        —
      </span>
    ),
  ]);

  return (
    <DataTable
      headers={['Output Type', 'Title', 'Author', 'Year', 'DOI']}
      rows={rows}
      emptyState={
        <EmptyState
          title="No research outputs yet"
          description="When group members add research outputs, they will appear here."
        />
      }
    />
  );
}
