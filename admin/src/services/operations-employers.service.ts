import { apiClient } from "./api-client";
import type {
  OperationsEmployerOption,
  OperationsEmployersSearchResult,
} from "../types/operations-post-job";

const OPERATIONS_EMPLOYERS_BASE = "/operations/employers";

export async function searchOperationsEmployers(params: {
  search: string;
  page?: number;
  limit?: number;
}): Promise<OperationsEmployersSearchResult> {
  const response = await apiClient.get<{ data: OperationsEmployersSearchResult }>(
    OPERATIONS_EMPLOYERS_BASE,
    {
      params: {
        search: params.search || undefined,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    },
  );

  return response.data.data;
}

export async function fetchOperationsEmployerById(
  employerId: string,
): Promise<OperationsEmployerOption> {
  const response = await apiClient.get<{ data: OperationsEmployerOption }>(
    `${OPERATIONS_EMPLOYERS_BASE}/${encodeURIComponent(employerId)}`,
  );

  return response.data.data;
}
