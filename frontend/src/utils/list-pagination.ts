export type ListPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

/** Normalize API pagination and fill hasNext/hasPrevious when older payloads omit them. */
export function normalizeListPagination(
  pagination: ListPaginationMeta | undefined,
  fallbackLimit: number,
): Required<ListPaginationMeta> {
  const limit = Math.max(1, pagination?.limit ?? fallbackLimit);
  const total = Math.max(0, pagination?.total ?? 0);
  const computedTotalPages = Math.max(1, Math.ceil(total / limit));
  const totalPages = Math.max(1, pagination?.totalPages ?? computedTotalPages);
  const page = Math.min(Math.max(1, pagination?.page ?? 1), totalPages);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: pagination?.hasNextPage ?? page < totalPages,
    hasPreviousPage: pagination?.hasPreviousPage ?? page > 1,
  };
}

/** Resolve the page to navigate to when the current page is empty after a mutation. */
export function resolveEmptyPageFallback(
  currentPage: number,
  totalPages: number,
): number {
  if (totalPages < 1) {
    return 1;
  }
  if (currentPage > totalPages) {
    return totalPages;
  }
  if (currentPage < 1) {
    return 1;
  }
  return currentPage;
}
