import { apiClient } from "@/services/api-client";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApplyToJobResult = {
  application: {
    id: string;
    publicJobId: string;
    resumeVersion: number;
    appliedAt: string;
    status: string;
  };
};

export async function applyToJob(publicJobId: string): Promise<ApplyToJobResult> {
  const response = await apiClient.post<ApiSuccess<ApplyToJobResult>>(
    "/applications/apply",
    { publicJobId },
  );

  return response.data.data;
}
