export type MonthYearGroup = {
  year: number;
  months: number[];
};

const MONTH_SHORT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonthYearValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatMonthYearLabel(value: string): string {
  const parsed = parseYearMonth(value);
  if (!parsed) return '';
  return `${MONTH_SHORT_LABELS[parsed.month - 1]} ${parsed.year}`;
}

export function monthShortLabel(month: number): string {
  if (month < 1 || month > 12) return '';
  return MONTH_SHORT_LABELS[month - 1];
}

export function parseYearMonth(value?: string | null): { year: number; month: number } | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export function getMonthRangeFromYearMonth(
  value?: string | null,
): { start: Date; end: Date } | null {
  const parsed = parseYearMonth(value);
  if (!parsed) return null;

  const start = new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
  const end = new Date(Date.UTC(parsed.year, parsed.month, 1));
  return { start, end };
}

export function buildMonthYearGroups(
  dates: Array<Date | null | undefined>,
): MonthYearGroup[] {
  const map = new Map<number, Set<number>>();

  for (const date of dates) {
    if (!date) continue;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    if (!map.has(year)) map.set(year, new Set<number>());
    map.get(year)!.add(month);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: Array.from(months).sort((a, b) => b - a),
    }));
}
