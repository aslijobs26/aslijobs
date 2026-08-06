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

function normalizeListItem(
  item: SeekerApplicationListItem,
): SeekerApplicationListItem {
  return {
    ...item,
    salarySortValue: item.salarySortValue ?? null,
    workMode: item.workMode ?? "",
    jobType: item.jobType ?? "",
    shiftLabel: item.shiftLabel ?? "",
    interviewDate: item.interviewDate ?? "",
    interviewTime: item.interviewTime ?? "",
    canWithdraw: Boolean(item.canWithdraw),
  };
}

function normalizeStats(stats: SeekerApplicationStats): SeekerApplicationStats {
  return {
    ...stats,
    withdrawn: stats.withdrawn ?? 0,
  };
}

export type FetchSeekerApplicationsParams = {
  status?: ApplicationStatus;
  statuses?: ApplicationStatus[];
  search?: string;
  sort?:
    | "newest"
    | "oldest"
    | "updated"
    | "salary_high"
    | "salary_low"
    | "company";
  location?: string;
  company?: string;
  jobType?: string;
  workMode?: string;
  shift?: string;
  minSalary?: number;
  appliedFrom?: string;
  appliedTo?: string;
  page?: number;
  limit?: number;
};

export async function fetchSeekerApplications(
  options?: FetchSeekerApplicationsParams,
): Promise<{
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
      statuses:
        options?.statuses && options.statuses.length > 0
          ? options.statuses.join(",")
          : undefined,
      search: options?.search || undefined,
      sort: options?.sort ?? "newest",
      location: options?.location || undefined,
      company: options?.company || undefined,
      jobType: options?.jobType || undefined,
      workMode: options?.workMode || undefined,
      shift: options?.shift || undefined,
      minSalary: options?.minSalary,
      appliedFrom: options?.appliedFrom || undefined,
      appliedTo: options?.appliedTo || undefined,
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
    },
  });

  const data = response.data.data;
  return {
    applications: data.applications.map(normalizeListItem),
    pagination: data.pagination,
  };
}

export async function fetchSeekerApplicationStats(): Promise<SeekerApplicationStats> {
  const response = await apiClient.get<
    ApiSuccess<{ stats: SeekerApplicationStats }>
  >("/applications/me/stats");

  return normalizeStats(response.data.data.stats);
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
