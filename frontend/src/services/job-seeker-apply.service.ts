import { apiClient } from "@/services/api-client";
import type { ApplicationResumeSource } from "@/types/job-seeker-resume";

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

export async function applyToJob(
  publicJobId: string,
  resumeSource?: ApplicationResumeSource,
): Promise<ApplyToJobResult> {
  const response = await apiClient.post<ApiSuccess<ApplyToJobResult>>(
    "/applications/apply",
    {
      publicJobId,
      ...(resumeSource ? { resumeSource } : {}),
    },
  );

  return response.data.data;
}
