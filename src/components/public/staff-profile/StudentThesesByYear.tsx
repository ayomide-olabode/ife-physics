'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { THESIS_STATUS_OPTIONS } from '@/lib/options';

type ThesisItem = {
  id: string;
  title: string;
  status: string;
  externalUrl: string | null;
  degreeLevel: string | null;
  programme: string | null;
  studentName: string | null;
  registrationNumber: string | null;
  year: number | null;
};

type GroupedYear = {
  key: string;
  label: string;
  items: ThesisItem[];
};

const THESIS_STATUS_LABELS = new Map<string, string>(
  THESIS_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

const DEGREE_LEVEL_LABELS: Record<string, string> = {
  BSC: 'B.S.c.',
  MSC: 'M.Sc.',
  MPHIL: 'M.Phil.',
  PHD: 'Ph.D.',
};

const PROGRAMME_LABELS: Record<string, string> = {
  PHY: 'Physics',
  EPH: 'Engineering Physics',
  SLT: 'Science Laboratory Trech',
};

function normalizeToken(value: string) {
  return value.replace(/\./g, '').replace(/\s+/g, '').trim().toUpperCase();
}

function formatThesisStatus(status: string) {
  return (
    THESIS_STATUS_LABELS.get(status) ||
    status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function formatDegreeLevel(value: string | null): string | null {
  if (!value?.trim()) return null;
  const normalized = normalizeToken(value);
  return DEGREE_LEVEL_LABELS[normalized] ?? value.trim();
}

function formatProgramme(value: string | null): string | null {
  if (!value?.trim()) return null;
  const normalized = normalizeToken(value);
  return PROGRAMME_LABELS[normalized] ?? value.trim();
}

function groupThesesByYear(items: ThesisItem[]): GroupedYear[] {
  const grouped = new Map<string, ThesisItem[]>();

  for (const thesis of items) {
    const key = thesis.year ? String(thesis.year) : 'undated';
    const list = grouped.get(key);
    if (list) {
      list.push(thesis);
    } else {
      grouped.set(key, [thesis]);
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

export function StudentThesesByYear({ items }: { items: ThesisItem[] }) {
  const groupedYears = useMemo(() => groupThesesByYear(items), [items]);
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
                  {group.items.map((thesis) => (
                    <article key={thesis.id} className="border border-gray-200 p-4 space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                        {formatThesisStatus(thesis.status)}
                      </p>

                      <h3 className="text-base font-semibold text-brand-navy">
                        {thesis.externalUrl ? (
                          <a
                            href={thesis.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {thesis.title}
                          </a>
                        ) : (
                          thesis.title
                        )}
                      </h3>

                      <p className="text-base text-gray-700">
                        {thesis.studentName || 'Student name not provided'}
                        {thesis.registrationNumber ? ` (${thesis.registrationNumber})` : ''}
                      </p>

                      <p className="text-base text-gray-700">
                        {[formatDegreeLevel(thesis.degreeLevel), formatProgramme(thesis.programme)]
                          .filter(Boolean)
                          .join(' ') ||
                          'Degree / programme not specified'}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
