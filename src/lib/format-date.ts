/**
 * Format a date value into dd/mm/yyyy.
 * Accepts Date objects, ISO strings, or null/undefined.
 * Returns '—' for null/undefined values.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/** Format as "27 Jul 2026" */
export function formatShortDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Extract 2-digit day from date (e.g. "07") */
export function formatDay(value: Date | string): string {
  return new Date(value).getDate().toString().padStart(2, '0');
}

/** Extract 3-letter uppercase month abbreviation (e.g. "FEB") */
export function formatMonthAbbrev(value: Date | string): string {
  return new Date(value).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
}

/** Extract 4-digit year */
export function formatYear(value: Date | string): string {
  return new Date(value).getFullYear().toString();
}
