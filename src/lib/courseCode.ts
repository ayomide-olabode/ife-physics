export function normalizeCourseCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}
