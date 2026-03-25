/**
 * Legacy → APA compat mapper for ResearchOutput rows.
 *
 * When editing rows created before the APA redesign, this maps:
 *   - flat `authors` string → best-effort authorsJson
 *   - legacy `venue` → metaJson type-specific key or sourceTitle
 *   - old metaJson keys (camelCase) → new snake_case keys
 */

import type { AuthorObject } from '@/lib/researchOutputTypes';

type LegacyRecord = {
  type: string;
  authors: string;
  doi?: string | null;
  venue?: string | null;
  authorsJson?: unknown;
  keywordsJson?: unknown;
  metaJson?: unknown;
  sourceTitle?: string | null;
  publisher?: string | null;
  groupAuthor?: string | null;
};

type MappedResult = {
  authorsJson: AuthorObject[];
  keywordsJson: string[];
  metaJson: Record<string, unknown>;
  doi: string;
  sourceTitle: string;
  publisher: string;
  groupAuthor: string;
};

/* ── Flat authors string → AuthorObject[] ── */

function parseFlatAuthors(raw: string): AuthorObject[] {
  if (!raw || !raw.trim()) return [];

  // Try splitting on semicolons first (e.g. "LastA, F.; LastB, G.")
  const bySemicolon = raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  if (bySemicolon.length > 1 || raw.includes(',')) {
    return bySemicolon.map((chunk) => {
      const parts = chunk.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        // "FamilyName, GivenName" or "FamilyName, G."
        return {
          family_name: parts[0],
          given_name: parts.slice(1).join(' ').trim(),
        };
      }
      // "FirstName LastName" or single name
      const words = chunk.split(/\s+/);
      if (words.length >= 2) {
        return {
          given_name: words.slice(0, -1).join(' '),
          family_name: words[words.length - 1],
        };
      }
      return { given_name: chunk, family_name: '' };
    });
  }

  // Try splitting on commas (e.g. "Smith J., Doe A.")
  const byComma = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (byComma.length > 1) {
    return byComma.map((chunk) => {
      const words = chunk.replace(/\.$/, '').split(/\s+/);
      if (words.length >= 2) {
        return {
          family_name: words[0],
          given_name: words.slice(1).join(' '),
        };
      }
      return { given_name: chunk, family_name: '' };
    });
  }

  // Single author — try "First Last" split
  const words = raw.trim().split(/\s+/);
  if (words.length >= 2) {
    return [
      {
        given_name: words.slice(0, -1).join(' '),
        family_name: words[words.length - 1],
      },
    ];
  }

  // Unrecognizable format — return as-is
  return [{ given_name: raw.trim(), family_name: '' }];
}

/* ── Old camelCase metaJson keys → new snake_case ── */

const META_KEY_MAP: Record<string, string> = {
  journalName: 'journal_title',
  conferenceName: 'conference_name',
  bookTitle: 'book_title',
  patentNumber: 'patent_number',
  awardingInstitution: 'institution',
};

function migrateMetaKeys(meta: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    const newKey = META_KEY_MAP[key] ?? key;
    // Don't overwrite if the new key already has a value
    if (newKey !== key && result[newKey] !== undefined) continue;
    result[newKey] = value;
  }
  return result;
}

const DOI_REGEX = /^10\.\d{4,9}\/\S+$/i;

function normalizeDoi(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withoutPrefix = trimmed
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');

  return DOI_REGEX.test(withoutPrefix) ? withoutPrefix : '';
}

function extractLegacyDoi(meta: Record<string, unknown>): string {
  const candidates = [
    meta.doi,
    meta.DOI,
    meta.doiUrl,
    meta.doiURL,
    meta.doi_url,
    meta.doiLink,
    meta.doi_link,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const normalized = normalizeDoi(candidate);
      if (normalized) return normalized;
    }
  }

  return '';
}

/* ── Main mapper ── */

export function mapLegacyToApa(data: LegacyRecord): MappedResult {
  // 1. Authors
  const existingAuthorsJson = Array.isArray(data.authorsJson)
    ? (data.authorsJson as AuthorObject[])
    : [];
  let authorsJson = existingAuthorsJson;
  if (authorsJson.length === 0 && data.authors) {
    authorsJson = parseFlatAuthors(data.authors);
  }

  // 2. Keywords
  const existingKeywords = Array.isArray(data.keywordsJson)
    ? (data.keywordsJson as string[]).filter((k) => typeof k === 'string')
    : [];

  // 3. MetaJson — migrate old keys + infer from legacy venue
  const rawMeta =
    data.metaJson && typeof data.metaJson === 'object' && !Array.isArray(data.metaJson)
      ? (data.metaJson as Record<string, unknown>)
      : {};
  const metaJson = migrateMetaKeys(rawMeta);

  // Preserve explicit DOI; otherwise backfill from common legacy metaJson keys.
  const doi = normalizeDoi(data.doi || '') || extractLegacyDoi(metaJson);

  // If venue exists but no sourceTitle and no type-specific key, map it
  let sourceTitle = data.sourceTitle || '';
  if (!sourceTitle && data.venue) {
    const t = data.type;
    if (t === 'JOURNAL_ARTICLE' && !metaJson.journal_title) {
      metaJson.journal_title = data.venue;
    } else if (t === 'CONFERENCE_PAPER' && !metaJson.conference_name) {
      metaJson.conference_name = data.venue;
    } else if (t === 'BOOK_CHAPTER' && !metaJson.book_title) {
      metaJson.book_title = data.venue;
    } else {
      // Safe fallback — use sourceTitle for display
      sourceTitle = data.venue;
    }
  }

  // 4. Publisher (keep existing if present)
  const publisher = data.publisher || '';

  // 5. Group author (keep existing if present)
  const groupAuthor = data.groupAuthor || '';

  return {
    authorsJson,
    keywordsJson: existingKeywords,
    metaJson,
    doi,
    sourceTitle,
    publisher,
    groupAuthor,
  };
}

/* ── Deep merge for metaJson on save ── */

export function mergeMetaJson(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    // Arrays (editorsJson, etc.) are overwritten, not concatenated
    result[key] = value;
  }
  return result;
}

/* ── Derive flat authors string ── */

export function deriveAuthorsString(
  authorsJson: AuthorObject[] | null | undefined,
  groupAuthor: string | null | undefined,
): string {
  if (authorsJson && authorsJson.length > 0) {
    if (authorsJson.length <= 5) {
      return authorsJson
        .map((a) => {
          const initials = a.given_name
            ? a.given_name
                .split(/\s+/)
                .map((w) => w[0]?.toUpperCase() + '.')
                .join(' ')
            : '';
          return [a.family_name, initials].filter(Boolean).join(', ');
        })
        .join('; ');
    }
    // More than 5 authors: first 3 + "et al."
    const first3 = authorsJson.slice(0, 3).map((a) => {
      const initials = a.given_name
        ? a.given_name
            .split(/\s+/)
            .map((w) => w[0]?.toUpperCase() + '.')
            .join(' ')
        : '';
      return [a.family_name, initials].filter(Boolean).join(', ');
    });
    return `${first3.join('; ')} et al.`;
  }
  if (groupAuthor && groupAuthor.trim()) return groupAuthor.trim();
  return '';
}

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase()}.`)
    .join(' ');
}

function formatSingleAuthorApa(author: AuthorObject): string {
  if (author.is_group) {
    const groupName = author.given_name?.trim() || author.family_name?.trim() || '';
    return groupName;
  }

  const family = author.family_name?.trim() || '';
  const initials = toInitials([author.given_name, author.middle_name].filter(Boolean).join(' '));
  return [family, initials].filter(Boolean).join(', ');
}

/**
 * Formats authors to APA-like "Last, F." and joins with commas using "&" before
 * the final author.
 */
export function formatAuthorsForDisplay(authorsJson: AuthorObject[] | null | undefined): string {
  if (!authorsJson?.length) return '';

  const formatted = authorsJson.map(formatSingleAuthorApa).filter(Boolean);
  if (formatted.length === 0) return '';
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`;

  return `${formatted.slice(0, -1).join(', ')} & ${formatted[formatted.length - 1]}`;
}
