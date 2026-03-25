export function formatYearRange(start?: number | null, end?: number | null): string {
  if (!start) return '';
  if (typeof end === 'number') return `${start} - ${end}`;
  return `${start} - `;
}
