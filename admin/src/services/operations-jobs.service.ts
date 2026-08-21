import { apiClient } from "./api-client";
import type {
  OperationsJobsListParams,
  OperationsJobsListResult,
} from "../types/operations-jobs";

const OPERATIONS_JOBS_BASE = "/operations/jobs";

export async function fetchOperationsJobs(
  params: OperationsJobsListParams,
): Promise<OperationsJobsListResult> {
  const response = await apiClient.get<{ data: OperationsJobsListResult }>(
    OPERATIONS_JOBS_BASE,
    {
      params: {
        page: params.page,
        limit: params.limit,
        tab: params.tab,
        search: params.search || undefined,
        status: params.status || undefined,
        paymentStatus: params.paymentStatus || undefined,
        category: params.category || undefined,
        location: params.location || undefined,
      },
    },
  );

  return response.data.data;
}
