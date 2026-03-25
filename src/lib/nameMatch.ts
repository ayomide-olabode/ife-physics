export type AuthorNameInput = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
};

export type ParsedAuthorName = {
  firstName: string;
  middleName: string;
  lastName: string;
  normalizedFirstName: string;
  normalizedMiddleName: string;
  normalizedLastName: string;
};

export type StaffNameCandidate = {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
};

export function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitTokens(fullName: string): string[] {
  return normalize(fullName).split(' ').filter(Boolean);
}

export function parseAuthorName(author: AuthorNameInput): ParsedAuthorName {
  const explicitFirst = author.firstName?.trim() || '';
  const explicitLast = author.lastName?.trim() || '';

  if (explicitFirst || explicitLast) {
    const firstTokens = splitTokens(explicitFirst);
    const first = firstTokens[0] || '';
    const middle = firstTokens.slice(1).join(' ');

    const normalizedLast = normalize(explicitLast);
    return {
      firstName: first,
      middleName: middle,
      lastName: explicitLast,
      normalizedFirstName: normalize(first),
      normalizedMiddleName: normalize(middle),
      normalizedLastName: normalizedLast,
    };
  }

  const fullName = author.fullName?.trim() || '';
  const tokens = splitTokens(fullName);
  if (tokens.length === 0) {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      normalizedFirstName: '',
      normalizedMiddleName: '',
      normalizedLastName: '',
    };
  }

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const middle = tokens.slice(1, -1).join(' ');

  return {
    firstName: first,
    middleName: middle,
    lastName: last,
    normalizedFirstName: first,
    normalizedMiddleName: middle,
    normalizedLastName: last,
  };
}

function startsWithSameInitial(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a[0] === b[0];
}

export function scoreCandidate(staff: StaffNameCandidate, author: ParsedAuthorName): number {
  const staffLast = normalize(staff.lastName || '');
  if (!staffLast || !author.normalizedLastName || staffLast !== author.normalizedLastName) {
    return -1;
  }

  const staffFirst = normalize(staff.firstName || '');
  const staffMiddle = normalize(staff.middleName || '');

  let score = 0;

  if (author.normalizedFirstName && staffFirst) {
    if (staffFirst === author.normalizedFirstName) {
      // First + last exact match is our high-confidence signal (~95%).
      score += 95;
    } else if (startsWithSameInitial(staffFirst, author.normalizedFirstName)) {
      score += 70;
    } else {
      return -1;
    }
  } else if (!author.normalizedFirstName) {
    score -= 40;
  }

  if (author.normalizedMiddleName && staffMiddle) {
    if (staffMiddle === author.normalizedMiddleName) {
      score += 5;
    } else if (startsWithSameInitial(staffMiddle, author.normalizedMiddleName)) {
      score += 3;
    }
  }

  return score;
}

export function findBestCandidate(
  candidates: StaffNameCandidate[],
  author: ParsedAuthorName,
): {
  best: StaffNameCandidate | null;
  secondBest: StaffNameCandidate | null;
  bestScore: number;
  secondScore: number;
} {
  let best: StaffNameCandidate | null = null;
  let secondBest: StaffNameCandidate | null = null;
  let bestScore = -1;
  let secondScore = -1;

  for (const candidate of candidates) {
    const score = scoreCandidate(candidate, author);
    if (score > bestScore) {
      secondBest = best;
      secondScore = bestScore;
      best = candidate;
      bestScore = score;
    } else if (score > secondScore) {
      secondBest = candidate;
      secondScore = score;
    }
  }

  return { best, secondBest, bestScore, secondScore };
}
