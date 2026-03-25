'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PROJECT_STATUS_OPTIONS } from '@/lib/options';

type ProjectItem = {
  id: string;
  title: string;
  acronym: string | null;
  descriptionHtml: string | null;
  url: string | null;
  status: string;
  isFunded: boolean;
  startYear: number | null;
  endYear: number | null;
};

type GroupedYear = {
  key: string;
  label: string;
  items: ProjectItem[];
};

const PROJECT_STATUS_LABELS = new Map(
  PROJECT_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

function stripHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatProjectStatus(status: string) {
  return (
    PROJECT_STATUS_LABELS.get(status) ||
    status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function groupProjectsByYear(items: ProjectItem[]): GroupedYear[] {
  const grouped = new Map<string, ProjectItem[]>();

  for (const project of items) {
    const year = project.startYear || project.endYear;
    const key = year ? String(year) : 'undated';
    const list = grouped.get(key);
    if (list) {
      list.push(project);
    } else {
      grouped.set(key, [project]);
    }
  }

  const keys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'undated') return 1;
    if (b === 'undated') return -1;
    return Number(b) - Number(a);
  });

  return keys.map((key) => ({
    key,
    label: key === 'undated' ? 'Undated' : key,
    items: grouped.get(key) || [],
  }));
}

export function StaffProjectsByYear({ items }: { items: ProjectItem[] }) {
  const groupedYears = useMemo(() => groupProjectsByYear(items), [items]);
  const [openYear, setOpenYear] = useState<string | null>(groupedYears[0]?.key ?? null);

  return (
    <div className="space-y-3">
      {groupedYears.map((group) => {
        const isOpen = openYear === group.key;

        return (
          <div key={group.key} className="border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenYear((prev) => (prev === group.key ? null : group.key))}
              className="flex w-full items-center justify-between bg-brand-navy px-6 py-4 text-left text-white"
            >
              <span className="text-lg font-semibold">{group.label}</span>
              {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>

            {isOpen ? (
              <div className="bg-white p-6">
                <div className="space-y-4">
                  {group.items.map((project) => {
                    const statusLine = project.isFunded
                      ? `${formatProjectStatus(project.status)} | Funded`
                      : formatProjectStatus(project.status);
                    const description = stripHtml(project.descriptionHtml);

                    return (
                      <article key={project.id} className="border border-gray-200 p-4 space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                          {statusLine}
                        </p>

                        <h3 className="text-base font-semibold text-brand-navy">
                          {project.url ? (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {project.title}
                              {project.acronym ? ` (${project.acronym})` : ''}
                            </a>
                          ) : (
                            <>
                              {project.title}
                              {project.acronym ? ` (${project.acronym})` : ''}
                            </>
                          )}
                        </h3>

                        {description ? <p className="text-base text-gray-700">{description}</p> : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
