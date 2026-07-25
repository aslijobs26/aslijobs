import { apiClient } from "@/services/api-client";
import type {
  ApplicationStatus,
  SeekerApplicationDetail,
  SeekerApplicationListItem,
  SeekerApplicationStats,
  SeekerApplicationsPagination,
} from "@/types/job-seeker-applications";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export async function fetchSeekerApplications(options?: {
  status?: ApplicationStatus;
  search?: string;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
}): Promise<{
  applications: SeekerApplicationListItem[];
  pagination: SeekerApplicationsPagination;
}> {
  const response = await apiClient.get<
    ApiSuccess<{
      applications: SeekerApplicationListItem[];
      pagination: SeekerApplicationsPagination;
    }>
  >("/applications/me", {
    params: {
      status: options?.status,
      search: options?.search || undefined,
      sort: options?.sort ?? "newest",
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
    },
  });

  return response.data.data;
}

export async function fetchSeekerApplicationStats(): Promise<SeekerApplicationStats> {
  const response = await apiClient.get<
    ApiSuccess<{ stats: SeekerApplicationStats }>
  >("/applications/me/stats");

  return response.data.data.stats;
}

export async function fetchSeekerApplication(
  applicationId: string,
): Promise<SeekerApplicationDetail> {
  const response = await apiClient.get<
    ApiSuccess<{ application: SeekerApplicationDetail }>
  >(`/applications/me/${applicationId}`);

  return response.data.data.application;
}

export async function withdrawSeekerApplication(
  applicationId: string,
): Promise<SeekerApplicationDetail> {
  const response = await apiClient.post<
    ApiSuccess<{ application: SeekerApplicationDetail }>
  >(`/applications/me/${applicationId}/withdraw`);

  return response.data.data.application;
}
