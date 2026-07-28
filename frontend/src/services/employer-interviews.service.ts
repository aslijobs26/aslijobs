import { apiClient } from "@/services/api-client";
import type {
  EmployerInterviewStatsPeriod,
  EmployerInterviewStatsResult,
  EmployerInterviewsListParams,
  EmployerInterviewsListResult,
} from "@/types/employer-interviews";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export async function fetchEmployerInterviews(
  options?: EmployerInterviewsListParams,
): Promise<EmployerInterviewsListResult> {
  const response = await apiClient.get<ApiSuccess<EmployerInterviewsListResult>>(
    "/applications/employer/interviews",
    {
      params: {
        publicJobId: options?.publicJobId || undefined,
        status: options?.status || undefined,
        mode: options?.mode || undefined,
        search: options?.search || undefined,
        interviewer: options?.interviewer || undefined,
        interviewFrom: options?.interviewFrom || undefined,
        interviewTo: options?.interviewTo || undefined,
        quickDate: options?.quickDate || undefined,
        sort: options?.sort || "interview_asc",
        page: options?.page ?? 1,
        limit: options?.limit ?? 10,
        rescheduledOnly: options?.rescheduledOnly ? "true" : undefined,
        cancelledOnly: options?.cancelledOnly ? "true" : undefined,
      },
    },
  );

  return response.data.data;
}

export async function fetchEmployerInterviewStats(options?: {
  publicJobId?: string;
  period?: EmployerInterviewStatsPeriod;
}): Promise<EmployerInterviewStatsResult> {
  const response = await apiClient.get<
    ApiSuccess<EmployerInterviewStatsResult>
  >("/applications/employer/interviews/stats", {
    params: {
      publicJobId: options?.publicJobId || undefined,
      period: options?.period || undefined,
    },
  });

  return response.data.data;
}
