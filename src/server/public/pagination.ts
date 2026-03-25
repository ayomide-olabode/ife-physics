import 'server-only';

/** Default page size for public list queries. */
export const DEFAULT_PAGE_SIZE = 10;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Compute skip/take and build the paginated result envelope. */
export function paginationArgs({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: PaginationParams) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
