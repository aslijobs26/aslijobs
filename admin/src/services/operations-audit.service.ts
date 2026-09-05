import { apiClient } from "./api-client";
import type { OperationsAuditEvent } from "../types/operations-team";

export async function fetchOperationsAuditLog(params: {
  page: number;
  limit: number;
  search?: string;
  action?: string;
  targetType?: string;
}): Promise<{
  events: OperationsAuditEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> {
  const response = await apiClient.get<{
    data: {
      events: OperationsAuditEvent[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    };
  }>("/operations/audit-log", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      action: params.action || undefined,
      targetType: params.targetType || undefined,
    },
  });
  return response.data.data;
}
