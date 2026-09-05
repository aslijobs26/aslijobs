import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchOperationsAuditLog } from "../services/operations-audit.service";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export function useOperationsAuditLog(params: {
  page: number;
  limit: number;
  search?: string;
  action?: string;
  targetType?: string;
}) {
  return useQuery({
    queryKey: ["operations", "audit-log", params],
    queryFn: () => fetchOperationsAuditLog(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) =>
      failureCount < 3 && isOperationsSessionTransientError(error),
  });
}
