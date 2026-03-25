import { ACADEMIC_RANK_VALUES } from '@/lib/options';

export const ACADEMIC_RANK_SORT_ORDER: Record<string, number> = Object.fromEntries(
  ACADEMIC_RANK_VALUES.map((rank, index) => [rank.toLowerCase(), index + 1]),
);

export function getAcademicRankSortValue(rank: string | null | undefined): number {
  if (!rank) return Number.MAX_SAFE_INTEGER;
  return ACADEMIC_RANK_SORT_ORDER[rank.trim().toLowerCase()] ?? Number.MAX_SAFE_INTEGER;
}
