export type ListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/**
 * Build list pagination metadata with clamped page.
 * Never returns totalPages < 1.
 */
export function buildListPagination(
  page: number,
  limit: number,
  total: number,
): ListPagination {
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / safeLimit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    page: safePage,
    limit: safeLimit,
    total: Math.max(0, total),
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}
