import { apiClient } from "@/services/api-client";
import type {
  SavedJobListItem,
  SavedJobsPagination,
  SavedJobsSort,
  SavedJobsStats,
  SavedJobsStatsFilter,
} from "@/types/saved-jobs";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export const savedJobsQueryKeys = {
  all: ["saved-jobs"] as const,
  list: (params: Record<string, unknown>) =>
    [...savedJobsQueryKeys.all, "list", params] as const,
  stats: () => [...savedJobsQueryKeys.all, "stats"] as const,
  ids: () => [...savedJobsQueryKeys.all, "ids"] as const,
};

export type FetchSavedJobsParams = {
  tab?: SavedJobsStatsFilter;
  search?: string;
  sort?: SavedJobsSort;
  location?: string;
  jobType?: string;
  workMode?: string;
  schedule?: string;
  experience?: string;
  company?: string;
  perk?: string;
  minSalary?: number;
  maxSalary?: number;
  page?: number;
  limit?: number;
};

export async function fetchSavedJobs(params: FetchSavedJobsParams = {}): Promise<{
  jobs: SavedJobListItem[];
  pagination: SavedJobsPagination;
  stats: SavedJobsStats;
}> {
  const response = await apiClient.get<
    ApiSuccess<{
      jobs: SavedJobListItem[];
      pagination: SavedJobsPagination;
      stats: SavedJobsStats;
    }>
  >("/saved-jobs/me", {
    params: {
      tab: params.tab ?? "all",
      search: params.search || undefined,
      sort: params.sort ?? "recently_saved",
      location: params.location || undefined,
      jobType: params.jobType || undefined,
      workMode: params.workMode || undefined,
      schedule: params.schedule || undefined,
      experience: params.experience || undefined,
      company: params.company || undefined,
      perk: params.perk || undefined,
      minSalary: params.minSalary,
      maxSalary: params.maxSalary,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });

  return response.data.data;
}

export async function fetchSavedJobsStats(): Promise<SavedJobsStats> {
  const response = await apiClient.get<ApiSuccess<{ stats: SavedJobsStats }>>(
    "/saved-jobs/me/stats",
  );
  return response.data.data.stats;
}

export async function fetchSavedJobIds(): Promise<string[]> {
  const response = await apiClient.get<
    ApiSuccess<{ publicJobIds: string[] }>
  >("/saved-jobs/me/ids");
  return response.data.data.publicJobIds;
}

export async function saveJob(publicJobId: string): Promise<SavedJobListItem> {
  const response = await apiClient.post<
    ApiSuccess<{ savedJob: SavedJobListItem }>
  >("/saved-jobs/me", { publicJobId });
  return response.data.data.savedJob;
}

export async function removeSavedJob(
  publicJobId: string,
): Promise<{ removed: boolean }> {
  const response = await apiClient.delete<
    ApiSuccess<{ removed: boolean }>
  >(`/saved-jobs/me/${encodeURIComponent(publicJobId)}`);
  return response.data.data;
}
