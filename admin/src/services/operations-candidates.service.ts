import { apiClient } from "./api-client";
import type {
  OperationsCandidateDetail,
  OperationsCandidatesListParams,
  OperationsCandidatesListResult,
} from "../types/operations-candidates";

const OPERATIONS_CANDIDATES_BASE = "/operations/candidates";

export async function fetchOperationsCandidates(
  params: OperationsCandidatesListParams,
): Promise<OperationsCandidatesListResult> {
  const response = await apiClient.get<{ data: OperationsCandidatesListResult }>(
    OPERATIONS_CANDIDATES_BASE,
    {
      params: {
        page: params.page,
        limit: params.limit,
        tab: params.tab,
        search: params.search || undefined,
        status: params.status || undefined,
        jobId: params.jobId || undefined,
        employerId: params.employerId || undefined,
        location: params.location || undefined,
        experience: params.experience || undefined,
        gender: params.gender || undefined,
        datePreset: params.datePreset,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        dateField: params.dateField,
      },
    },
  );

  return response.data.data;
}

export async function fetchOperationsCandidateDetail(
  jobSeekerId: string,
): Promise<OperationsCandidateDetail> {
  const response = await apiClient.get<{ data: OperationsCandidateDetail }>(
    `${OPERATIONS_CANDIDATES_BASE}/seekers/${encodeURIComponent(jobSeekerId)}`,
  );

  return response.data.data;
}
