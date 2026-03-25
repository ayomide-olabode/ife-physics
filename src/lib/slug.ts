import { toMiddleInitial } from '@/lib/name';

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)+/g, ''); // Remove leading or trailing hyphens
}

export function buildStaffSlug({
  title,
  firstName,
  middleName,
  lastName,
}: {
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}): string {
  void title;
  const middleInitial = toMiddleInitial(middleName)?.replace('.', '');
  const parts = [firstName, middleInitial, lastName]
    .map((part) => slugify(part ?? ''))
    .filter(Boolean);
  return slugify(parts.join('-'));
}
