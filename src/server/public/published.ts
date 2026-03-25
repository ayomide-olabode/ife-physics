import 'server-only';

/**
 * Composable where-clause helpers for public queries.
 * Use these to enforce published-only + soft-delete gating
 * without hardcoding conditions in every query.
 */

/** Filters for models with a PublishStatus `status` field. */
export function wherePublished() {
  return { status: 'PUBLISHED' as const, deletedAt: null };
}

/** Filters for models that only use soft-delete (no status field). */
export function whereNotDeleted() {
  return { deletedAt: null };
}
