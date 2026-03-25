/**
 * Utility for formatting names cleanly without double spaces.
 */
export function formatFullName({
  firstName,
  middleName,
  lastName,
}: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}): string {
  return [firstName, middleName, lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .trim();
}

export function toMiddleInitial(middleName?: string | null): string | undefined {
  const trimmed = middleName?.trim();
  if (!trimmed) return undefined;

  const normalized = trimmed.replace(/\.+$/g, '');
  if (!normalized) return undefined;

  const initial = normalized.length === 1 ? normalized : normalized.charAt(0);
  return `${initial.toUpperCase()}.`;
}

export function formatFullNameWithMiddleInitial({
  firstName,
  middleName,
  lastName,
}: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}): string {
  const middleInitial = toMiddleInitial(middleName);
  return [firstName?.trim(), middleInitial, lastName?.trim()]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .trim();
}

export const formatPersonName = formatFullName;
